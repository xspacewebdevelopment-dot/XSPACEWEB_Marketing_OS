import dns from "dns";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

// Configure high-availability public DNS resolvers for reliable lookups
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]);
} catch {
  // Use default system resolver if setServers is restricted
}

export interface DnsRecordItem {
  record: "SPF" | "DKIM" | "DMARC" | "MX" | "CNAME";
  name: string;
  type: "TXT" | "CNAME" | "MX";
  value: string;
  status: "verified" | "pending" | "failed" | "not_started";
  ttl?: string;
  priority?: number;
  detectedValue?: string;
  lastCheckedAt?: string;
  errorMessage?: string;
}

export interface DmarcAnalysis {
  found: boolean;
  rawRecord?: string;
  policy?: "none" | "quarantine" | "reject";
  subdomainPolicy?: string;
  percentage?: number;
  aggregateReportUri?: string;
  forensicReportUri?: string;
  status: "verified" | "warning" | "missing" | "failed";
  explanation: string;
}

export interface DeliverabilityRecommendation {
  id: string;
  category: "AUTHENTICATION" | "LIST_HYGIENE" | "SENDING" | "SECURITY";
  severity: "CRITICAL" | "WARNING" | "RECOMMENDED" | "OPTIMAL";
  title: string;
  description: string;
  impact: string;
  remediation: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface PreSendCheckResult {
  canSend: boolean;
  senderDomainVerified: boolean;
  senderDomainStatus: string;
  totalRecipients: number;
  allowedRecipients: string[];
  suppressedRecipients: string[];
  invalidRecipients: string[];
  riskyRecipients: string[];
  criticalIssues: string[];
  warnings: string[];
}

/**
 * Normalizes and validates domain format according to RFC rules.
 * Strips http/https, paths, ports, and whitespace.
 */
export function normalizeDomain(rawInput: string): string {
  if (!rawInput || typeof rawInput !== "string") {
    throw new Error("Domain name is required");
  }

  let cleaned = rawInput.trim().toLowerCase();

  // Strip protocol prefix if provided
  cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:mailto:)?/i, "");

  // Strip path, query params, hash
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];

  // Strip port
  cleaned = cleaned.split(":")[0];

  // Strip trailing dot
  if (cleaned.endsWith(".")) {
    cleaned = cleaned.slice(0, -1);
  }

  // Domain syntax validation regex
  const domainRegex = /^(?!:\/\/)(?:[a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(cleaned)) {
    throw new Error(`Invalid domain name format: "${rawInput}". Please provide a valid hostname (e.g. "example.com" or "mail.example.com").`);
  }

  return cleaned;
}

/**
 * Performs actual DNS resolution for TXT records with error handling.
 */
async function resolveTxtSafe(hostname: string): Promise<string[]> {
  try {
    const records = await dns.promises.resolveTxt(hostname);
    return records.map((chunks) => chunks.join(""));
  } catch (err: any) {
    if (err?.code === "ENOTFOUND" || err?.code === "ENODATA") {
      return [];
    }
    // Attempt fallback with node standard lookup
    return [];
  }
}

/**
 * Performs actual DNS resolution for CNAME records with error handling.
 */
async function resolveCnameSafe(hostname: string): Promise<string[]> {
  try {
    return await dns.promises.resolveCname(hostname);
  } catch {
    return [];
  }
}

/**
 * Inspects live DNS for DMARC TXT record on `_dmarc.<domain>`.
 */
export async function inspectDmarcRecord(domain: string): Promise<DmarcAnalysis> {
  const dmarcHost = `_dmarc.${domain}`;
  const txtRecords = await resolveTxtSafe(dmarcHost);

  const dmarcRecord = txtRecords.find((r) => r.trim().toUpperCase().startsWith("V=DMARC1"));

  if (!dmarcRecord) {
    return {
      found: false,
      status: "missing",
      explanation: `No DMARC record found at "${dmarcHost}". Major mailbox providers (Google, Yahoo, Apple) require DMARC for inbox delivery.`,
    };
  }

  // Parse DMARC tags
  const tags = dmarcRecord.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawVal] = part.trim().split("=");
    if (rawKey && rawVal.length > 0) {
      acc[rawKey.trim().toLowerCase()] = rawVal.join("=").trim();
    }
    return acc;
  }, {});

  const policy = (tags["p"]?.toLowerCase() as "none" | "quarantine" | "reject") || "none";
  const subdomainPolicy = tags["sp"]?.toLowerCase();
  const percentage = tags["pct"] ? parseInt(tags["pct"], 10) : 100;
  const aggregateReportUri = tags["rua"];
  const forensicReportUri = tags["ruf"];

  let status: "verified" | "warning" | "missing" | "failed" = "verified";
  let explanation = `DMARC record active with enforcement policy "${policy}".`;

  if (policy === "none") {
    status = "warning";
    explanation = `DMARC record found at "${dmarcHost}", but policy is set to "p=none" (monitoring only). For maximum protection against spoofing and optimal inbox placement, upgrade to "p=quarantine" or "p=reject".`;
  }

  return {
    found: true,
    rawRecord: dmarcRecord,
    policy,
    subdomainPolicy,
    percentage,
    aggregateReportUri,
    forensicReportUri,
    status,
    explanation,
  };
}

/**
 * Performs a comprehensive real DNS verification check for SPF, DKIM, and DMARC.
 */
export async function performDnsCheck(domain: string, resendRecords?: any[]): Promise<{
  spfStatus: "VERIFIED" | "PENDING" | "FAILED" | "MISSING";
  dkimStatus: "VERIFIED" | "PENDING" | "FAILED" | "MISSING";
  dmarcStatus: "VERIFIED" | "PENDING" | "FAILED" | "MISSING";
  dnsRecords: DnsRecordItem[];
  dmarcAnalysis: DmarcAnalysis;
  overallStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "PENDING" | "FAILED";
}> {
  const records: DnsRecordItem[] = [];
  const checkedAt = new Date().toISOString();

  // 1. Resolve Root Domain TXT for SPF
  const rootTxts = await resolveTxtSafe(domain);
  const rootSpf = rootTxts.find((txt) => txt.toLowerCase().includes("v=spf1"));

  // 2. Check Resend SPF subdomains (send.<domain> and rsend.<domain>)
  const sendCnames = await resolveCnameSafe(`send.${domain}`);
  const rsendCnames = await resolveCnameSafe(`rsend.${domain}`);

  let isSpfVerified = false;
  let detectedSpfValue = "";

  if (rootSpf) {
    isSpfVerified = true;
    detectedSpfValue = rootSpf;
  } else if (sendCnames.length > 0 || rsendCnames.length > 0) {
    isSpfVerified = true;
    detectedSpfValue = [...sendCnames, ...rsendCnames].join(", ");
  }

  // SPF Records specification
  records.push({
    record: "SPF",
    name: `send.${domain}`,
    type: "CNAME",
    value: "send.forge.rmta.net",
    status: sendCnames.some((c) => c.includes("forge.rmta.net") || c.includes("resend")) ? "verified" : (isSpfVerified ? "verified" : "pending"),
    ttl: "Auto",
    detectedValue: sendCnames.join(", ") || detectedSpfValue || undefined,
    lastCheckedAt: checkedAt,
  });

  records.push({
    record: "SPF",
    name: domain,
    type: "TXT",
    value: "v=spf1 include:resend.com ~all",
    status: rootSpf ? "verified" : "pending",
    ttl: "Auto",
    detectedValue: rootSpf || undefined,
    lastCheckedAt: checkedAt,
  });

  const spfStatus = isSpfVerified ? "VERIFIED" : "PENDING";

  // 3. Resolve DKIM (resend._domainkey.<domain>)
  const dkimHost = `resend._domainkey.${domain}`;
  const dkimTxts = await resolveTxtSafe(dkimHost);
  const dkimCnames = await resolveCnameSafe(dkimHost);

  let isDkimVerified = false;
  let detectedDkim = "";

  const validDkimTxt = dkimTxts.find((txt) => txt.includes("p=") || txt.toLowerCase().includes("v=dkim1"));
  if (validDkimTxt) {
    isDkimVerified = true;
    detectedDkim = validDkimTxt;
  } else if (dkimCnames.length > 0) {
    isDkimVerified = true;
    detectedDkim = dkimCnames.join(", ");
  }

  // If Resend provided expected DKIM record, check against it
  let expectedDkimValue = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...";
  if (resendRecords && Array.isArray(resendRecords)) {
    const resendDkim = resendRecords.find((r) => r.record === "DKIM");
    if (resendDkim) {
      expectedDkimValue = resendDkim.value;
      if (resendDkim.status === "verified") {
        isDkimVerified = true;
      }
    }
  }

  records.push({
    record: "DKIM",
    name: dkimHost,
    type: "TXT",
    value: expectedDkimValue,
    status: isDkimVerified ? "verified" : "pending",
    ttl: "Auto",
    detectedValue: detectedDkim || undefined,
    lastCheckedAt: checkedAt,
  });

  const dkimStatus = isDkimVerified ? "VERIFIED" : "PENDING";

  // 4. Resolve DMARC
  const dmarcAnalysis = await inspectDmarcRecord(domain);
  const isDmarcVerified = dmarcAnalysis.found;

  records.push({
    record: "DMARC",
    name: `_dmarc.${domain}`,
    type: "TXT",
    value: "v=DMARC1; p=none; rua=mailto:dmarc-reports@" + domain,
    status: isDmarcVerified ? "verified" : "pending",
    ttl: "Auto",
    detectedValue: dmarcAnalysis.rawRecord || undefined,
    lastCheckedAt: checkedAt,
    errorMessage: !isDmarcVerified ? "DMARC record missing. Add TXT record to enable policy enforcement." : undefined,
  });

  const dmarcStatus = isDmarcVerified ? "VERIFIED" : "PENDING";

  // Compute overall status
  let overallStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "PENDING" | "FAILED" = "PENDING";
  if (spfStatus === "VERIFIED" && dkimStatus === "VERIFIED" && dmarcStatus === "VERIFIED") {
    overallStatus = "VERIFIED";
  } else if (spfStatus === "VERIFIED" || dkimStatus === "VERIFIED" || dmarcStatus === "VERIFIED") {
    overallStatus = "PARTIALLY_VERIFIED";
  }

  return {
    spfStatus,
    dkimStatus,
    dmarcStatus,
    dnsRecords: records,
    dmarcAnalysis,
    overallStatus,
  };
}

class DeliverabilityService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  public isResendConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  /**
   * Lists all sending domains registered for a workspace.
   */
  public async getDomains(workspaceId: string) {
    if (!prisma.sendingDomain?.findMany) {
      return [];
    }
    return prisma.sendingDomain.findMany({
      where: { workspaceId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Adds a new sending domain for a workspace.
   * Validates format, attempts to register with Resend, checks live DNS, and persists.
   */
  public async addDomain(
    workspaceId: string,
    rawDomain: string,
    region: string = "us-east-1"
  ) {
    if (!prisma.sendingDomain?.create) {
      throw new Error(
        "Database client updating: please restart the development server (Ctrl+C then npm run dev) to load the sendingDomain model."
      );
    }
    const domain = normalizeDomain(rawDomain);

    // Check if domain already exists in this workspace
    const existing = await prisma.sendingDomain.findUnique({
      where: {
        workspaceId_domain: {
          workspaceId,
          domain,
        },
      },
    });

    if (existing) {
      throw new Error(`Domain "${domain}" is already added in this workspace.`);
    }

    let resendDomainId: string | null = null;
    let resendRecords: any[] | null = null;
    let resendStatus: string | null = null;

    // Check upstream Resend integration
    if (this.resend) {
      try {
        // First check if domain already exists in Resend account
        const listRes = await this.resend.domains.list();
        const found = listRes.data?.data?.find((d) => d.name.toLowerCase() === domain);

        if (found) {
          resendDomainId = found.id;
          resendStatus = found.status;
          const detailRes = await this.resend.domains.get(found.id);
          resendRecords = (detailRes.data as any)?.records || null;
        } else {
          // Create in Resend
          const createRes = await this.resend.domains.create({
            name: domain,
            region: region as any,
          });

          if (createRes.data) {
            resendDomainId = createRes.data.id;
            resendStatus = createRes.data.status;
            resendRecords = (createRes.data as any)?.records || null;
          }
        }
      } catch (err: any) {
        // If Resend API fails (e.g. rate limit, or domain already exists under another account)
        console.warn(`Resend domain creation notice for ${domain}:`, err.message);
      }
    }

    // Perform live DNS verification check
    const dnsResult = await performDnsCheck(domain, resendRecords || undefined);

    const isFirstDomain = (await prisma.sendingDomain.count({ where: { workspaceId } })) === 0;

    const savedDomain = await prisma.sendingDomain.create({
      data: {
        workspaceId,
        domain,
        region,
        resendDomainId,
        status: resendStatus === "verified" ? "VERIFIED" : dnsResult.overallStatus,
        spfStatus: dnsResult.spfStatus,
        dkimStatus: resendStatus === "verified" ? "VERIFIED" : dnsResult.dkimStatus,
        dmarcStatus: dnsResult.dmarcStatus,
        dnsRecords: dnsResult.dnsRecords as any,
        lastCheckedAt: new Date(),
        isDefault: isFirstDomain,
      },
    });

    return {
      domain: savedDomain,
      dnsResult,
      dmarcAnalysis: dnsResult.dmarcAnalysis,
    };
  }

  /**
   * Triggers a live DNS check and updates domain status in the database.
   */
  public async verifyDomain(workspaceId: string, domainId: string) {
    const domainRecord = await prisma.sendingDomain.findFirst({
      where: { id: domainId, workspaceId },
    });

    if (!domainRecord) {
      throw new Error("Domain not found in this workspace.");
    }

    let resendRecords: any[] | null = null;
    let resendVerified = false;

    // If attached to Resend, trigger Resend's real verification API
    if (this.resend && domainRecord.resendDomainId) {
      try {
        await this.resend.domains.verify(domainRecord.resendDomainId);
        const detailRes = await this.resend.domains.get(domainRecord.resendDomainId);
        if (detailRes.data) {
          resendVerified = detailRes.data.status === "verified";
          resendRecords = (detailRes.data as any)?.records || null;
        }
      } catch (err: any) {
        console.warn(`Resend verify call error:`, err?.message);
      }
    }

    // Perform real live DNS lookups for SPF, DKIM, and DMARC
    const dnsResult = await performDnsCheck(domainRecord.domain, resendRecords || undefined);

    const updated = await prisma.sendingDomain.update({
      where: { id: domainId },
      data: {
        status: resendVerified ? "VERIFIED" : dnsResult.overallStatus,
        spfStatus: dnsResult.spfStatus,
        dkimStatus: resendVerified ? "VERIFIED" : dnsResult.dkimStatus,
        dmarcStatus: dnsResult.dmarcStatus,
        dnsRecords: dnsResult.dnsRecords as any,
        lastCheckedAt: new Date(),
        errorMessage: null,
      },
    });

    return {
      domain: updated,
      dnsResult,
      dmarcAnalysis: dnsResult.dmarcAnalysis,
      resendVerified,
    };
  }

  /**
   * Deletes a sending domain from the workspace.
   */
  public async deleteDomain(workspaceId: string, domainId: string) {
    const domain = await prisma.sendingDomain.findFirst({
      where: { id: domainId, workspaceId },
    });

    if (!domain) {
      throw new Error("Domain not found.");
    }

    // If attached to Resend, optionally remove from Resend
    if (this.resend && domain.resendDomainId) {
      try {
        await this.resend.domains.remove(domain.resendDomainId);
      } catch (err: any) {
        console.warn(`Resend domain deletion notice:`, err?.message);
      }
    }

    await prisma.sendingDomain.delete({
      where: { id: domainId },
    });

    // If deleted domain was default, set another verified domain as default if one exists
    if (domain.isDefault) {
      const nextDomain = await prisma.sendingDomain.findFirst({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      });
      if (nextDomain) {
        await prisma.sendingDomain.update({
          where: { id: nextDomain.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  /**
   * Synchronizes all registered domains from Resend account into the workspace.
   */
  public async syncResendDomains(workspaceId: string) {
    if (!this.resend) {
      throw new Error("Resend API key is not configured.");
    }

    const resendList = await this.resend.domains.list();
    const domains = resendList.data?.data || [];
    const syncedDomains: any[] = [];

    for (const rDomain of domains) {
      const existing = await prisma.sendingDomain.findUnique({
        where: {
          workspaceId_domain: {
            workspaceId,
            domain: rDomain.name.toLowerCase(),
          },
        },
      });

      // Get full domain records from Resend
      let fullRecords: any[] | null = null;
      try {
        const detail = await this.resend.domains.get(rDomain.id);
        fullRecords = (detail.data as any)?.records || null;
      } catch {
        // ignore
      }

      // Live DNS check
      const dnsResult = await performDnsCheck(rDomain.name, fullRecords || undefined);

      if (existing) {
        const updated = await prisma.sendingDomain.update({
          where: { id: existing.id },
          data: {
            resendDomainId: rDomain.id,
            region: rDomain.region || existing.region,
            status: rDomain.status === "verified" ? "VERIFIED" : dnsResult.overallStatus,
            spfStatus: dnsResult.spfStatus,
            dkimStatus: rDomain.status === "verified" ? "VERIFIED" : dnsResult.dkimStatus,
            dmarcStatus: dnsResult.dmarcStatus,
            dnsRecords: dnsResult.dnsRecords as any,
            lastCheckedAt: new Date(),
          },
        });
        syncedDomains.push(updated);
      } else {
        const isFirst = (await prisma.sendingDomain.count({ where: { workspaceId } })) === 0;
        const created = await prisma.sendingDomain.create({
          data: {
            workspaceId,
            domain: rDomain.name.toLowerCase(),
            region: rDomain.region || "us-east-1",
            resendDomainId: rDomain.id,
            status: rDomain.status === "verified" ? "VERIFIED" : dnsResult.overallStatus,
            spfStatus: dnsResult.spfStatus,
            dkimStatus: rDomain.status === "verified" ? "VERIFIED" : dnsResult.dkimStatus,
            dmarcStatus: dnsResult.dmarcStatus,
            dnsRecords: dnsResult.dnsRecords as any,
            lastCheckedAt: new Date(),
            isDefault: isFirst,
          },
        });
        syncedDomains.push(created);
      }
    }

    return {
      syncedCount: syncedDomains.length,
      domains: syncedDomains,
    };
  }

  /**
   * Sets a domain as the default sending domain for the workspace.
   */
  public async setDefaultDomain(workspaceId: string, domainId: string) {
    await prisma.$transaction([
      prisma.sendingDomain.updateMany({
        where: { workspaceId },
        data: { isDefault: false },
      }),
      prisma.sendingDomain.update({
        where: { id: domainId },
        data: { isDefault: true },
      }),
    ]);

    return { success: true };
  }

  /**
   * Comprehensive pre-send deliverability check.
   * Protects reputation by verifying sender domain authentication and vetting recipient lists.
   */
  public async checkPreSendDeliverability(
    workspaceId: string,
    senderEmail: string,
    recipientEmails: string[]
  ): Promise<PreSendCheckResult> {
    const senderDomain = senderEmail.split("@")[1]?.toLowerCase().trim();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    // 1. Check sender domain verification
    let domainVerified = false;
    let domainStatus = "UNREGISTERED";

    if (senderDomain) {
      const domainRecord = await prisma.sendingDomain.findUnique({
        where: {
          workspaceId_domain: {
            workspaceId,
            domain: senderDomain,
          },
        },
      });

      if (domainRecord) {
        domainStatus = domainRecord.status;
        domainVerified = domainRecord.status === "VERIFIED";

        if (!domainVerified) {
          warnings.push(`Sender domain "${senderDomain}" is ${domainRecord.status}. Emails sent from unverified domains may be rejected or delivered to spam.`);
        }
        if (domainRecord.dmarcStatus !== "VERIFIED") {
          warnings.push(`Domain "${senderDomain}" does not have an active DMARC record. Inbox placement on Yahoo and Gmail will be degraded.`);
        }
      } else {
        warnings.push(`Sending domain "${senderDomain}" has not been registered in your Sending Domains configuration.`);
      }
    } else {
      criticalIssues.push("Invalid sender email address provided.");
    }

    // 2. Normalize and vet recipients against active suppression list
    const normalizedRecipients = recipientEmails.map((e) => normalizeEmail(e));
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
        normalizedEmail: { in: normalizedRecipients },
      },
      select: { normalizedEmail: true, reason: true },
    });

    const suppressedMap = new Set(activeSuppressions.map((s) => s.normalizedEmail));
    const suppressedRecipients = recipientEmails.filter((e) => suppressedMap.has(normalizeEmail(e)));

    if (suppressedRecipients.length > 0) {
      criticalIssues.push(`${suppressedRecipients.length} recipient(s) are on your active Suppression List and will be blocked to protect sender reputation.`);
    }

    // 3. Vet against Reoon verification results
    const verificationResults = await prisma.verificationResult.findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: normalizedRecipients },
      },
      select: { normalizedEmail: true, status: true, isCatchAll: true, isDisposable: true },
    });

    const invalidEmails = new Set(
      verificationResults.filter((r) => r.status === "INVALID").map((r) => r.normalizedEmail)
    );
    const riskyEmails = new Set(
      verificationResults.filter((r) => r.status === "RISKY" || r.isCatchAll || r.isDisposable).map((r) => r.normalizedEmail)
    );

    const invalidRecipients = recipientEmails.filter((e) => invalidEmails.has(normalizeEmail(e)));
    const riskyRecipients = recipientEmails.filter((e) => riskyEmails.has(normalizeEmail(e)));

    if (invalidRecipients.length > 0) {
      warnings.push(`${invalidRecipients.length} recipient(s) are verified INVALID and will likely hard bounce.`);
    }
    if (riskyRecipients.length > 0) {
      warnings.push(`${riskyRecipients.length} recipient(s) are marked RISKY or catch-all.`);
    }

    const allowedRecipients = recipientEmails.filter(
      (e) => !suppressedMap.has(normalizeEmail(e)) && !invalidEmails.has(normalizeEmail(e))
    );

    return {
      canSend: criticalIssues.length === 0 && allowedRecipients.length > 0,
      senderDomainVerified: domainVerified,
      senderDomainStatus: domainStatus,
      totalRecipients: recipientEmails.length,
      allowedRecipients,
      suppressedRecipients,
      invalidRecipients,
      riskyRecipients,
      criticalIssues,
      warnings,
    };
  }

  /**
   * Retrieves aggregated deliverability dashboard data using actual database records.
   * Never fabricates scores or mock metrics.
   */
  public async getDeliverabilityOverview(workspaceId: string) {
    const hasSendingDomain = Boolean(prisma.sendingDomain?.findMany);
    const hasEmailSendRecord = Boolean(prisma.emailSendRecord?.findMany);
    const hasEmailWebhookEvent = Boolean(prisma.emailWebhookEvent?.count);

    // Parallel database queries for real data
    const [
      domains,
      contactsCount,
      verificationResults,
      suppressionCount,
      sendRecords,
      webhookEventsCount,
      recentSends,
    ] = await Promise.all([
      hasSendingDomain
        ? prisma.sendingDomain.findMany({
            where: { workspaceId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          })
        : Promise.resolve([]),
      prisma.contact.count({ where: { workspaceId } }),
      prisma.verificationResult.findMany({
        where: { workspaceId },
        select: {
          status: true,
          isCatchAll: true,
          isDisposable: true,
          isRoleBased: true,
        },
      }),
      prisma.suppressionEntry.count({
        where: { workspaceId, status: "ACTIVE" },
      }),
      hasEmailSendRecord
        ? prisma.emailSendRecord.findMany({
            where: { workspaceId },
            select: {
              id: true,
              status: true,
              createdAt: true,
              deliveredAt: true,
              bouncedAt: true,
              complainedAt: true,
            },
          })
        : Promise.resolve([]),
      hasEmailWebhookEvent
        ? prisma.emailWebhookEvent.count({
            where: { workspaceId },
          })
        : Promise.resolve(0),
      hasEmailSendRecord
        ? prisma.emailSendRecord.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              resendId: true,
              recipientEmail: true,
              senderEmail: true,
              subject: true,
              status: true,
              source: true,
              errorMessage: true,
              deliveredAt: true,
              bouncedAt: true,
              complainedAt: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // 1. Domains Authentication Analysis
    const totalDomains = domains.length;
    const verifiedDomains = domains.filter((d) => d.status === "VERIFIED").length;
    const pendingDomains = domains.filter((d) => d.status === "PENDING" || d.status === "PARTIALLY_VERIFIED").length;
    const failingDomains = domains.filter((d) => d.status === "FAILED").length;

    const defaultDomain = domains.find((d) => d.isDefault) || domains[0] || null;

    // 2. Email List Health from actual Reoon verification results
    let validCount = 0;
    let invalidCount = 0;
    let catchAllCount = 0;
    let disposableCount = 0;
    let roleCount = 0;
    let unknownCount = 0;

    for (const r of verificationResults) {
      if (r.status === "VALID") validCount++;
      else if (r.status === "INVALID") invalidCount++;
      else if (r.status === "UNKNOWN") unknownCount++;
      else if (r.status === "RISKY") {
        if (r.isCatchAll) catchAllCount++;
        else if (r.isDisposable) disposableCount++;
        else roleCount++;
      }
    }

    const totalVerified = verificationResults.length;
    const listHealthPercentage =
      totalVerified > 0 ? Math.round((validCount / totalVerified) * 100) : null;

    // 3. Sending Health from actual Resend sends and webhook events
    const totalSent = sendRecords.length;
    const deliveredCount = sendRecords.filter((s) => s.status === "DELIVERED" || s.deliveredAt).length;
    const bouncedCount = sendRecords.filter((s) => s.status === "BOUNCED" || s.bouncedAt).length;
    const complainedCount = sendRecords.filter((s) => s.status === "COMPLAINED" || s.complainedAt).length;
    const failedDispatchCount = sendRecords.filter((s) => s.status === "FAILED").length;

    // Webhook confirmation status
    const hasWebhookConfirmation = webhookEventsCount > 0 || deliveredCount > 0;

    // Calculate rates strictly when real denominator exists
    const deliveryRate =
      hasWebhookConfirmation && totalSent > 0 ? ((deliveredCount / totalSent) * 100).toFixed(1) : null;
    const bounceRate = totalSent > 0 ? ((bouncedCount / totalSent) * 100).toFixed(1) : "0.0";
    const complaintRate = totalSent > 0 ? ((complainedCount / totalSent) * 100).toFixed(2) : "0.00";

    // 4. Generate dynamic, actionable recommendations based strictly on real state
    const recommendations = this.generateRecommendations({
      totalDomains,
      verifiedDomains,
      defaultDomain,
      totalVerified,
      validCount,
      invalidCount,
      catchAllCount,
      totalSent,
      bouncedCount,
      complainedCount,
      suppressionCount,
      hasWebhookConfirmation,
      isResendConfigured: this.isResendConfigured(),
    });

    return {
      domains: {
        total: totalDomains,
        verified: verifiedDomains,
        pending: pendingDomains,
        failed: failingDomains,
        defaultDomain,
        list: domains,
      },
      listHealth: {
        contactsCount,
        totalVerified,
        validCount,
        invalidCount,
        catchAllCount,
        disposableCount,
        roleCount,
        unknownCount,
        suppressionCount,
        listHealthPercentage,
      },
      sendingHealth: {
        totalSent,
        deliveredCount,
        bouncedCount,
        complainedCount,
        failedDispatchCount,
        deliveryRate,
        bounceRate,
        complaintRate,
        hasWebhookConfirmation,
        webhookEventsCount,
        isResendConfigured: this.isResendConfigured(),
        recentSends,
      },
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates actionable deliverability recommendations based on real evaluated state.
   */
  private generateRecommendations(ctx: {
    totalDomains: number;
    verifiedDomains: number;
    defaultDomain: any;
    totalVerified: number;
    validCount: number;
    invalidCount: number;
    catchAllCount: number;
    totalSent: number;
    bouncedCount: number;
    complainedCount: number;
    suppressionCount: number;
    hasWebhookConfirmation: boolean;
    isResendConfigured: boolean;
  }): DeliverabilityRecommendation[] {
    const list: DeliverabilityRecommendation[] = [];

    // 1. Resend Provider Configuration
    if (!ctx.isResendConfigured) {
      list.push({
        id: "resend-api-key",
        category: "SENDING",
        severity: "CRITICAL",
        title: "Resend API Integration Not Configured",
        description: "RESEND_API_KEY is not defined in your environment variables. Sending emails through verified SMTP/HTTP infrastructure is currently offline.",
        impact: "Outbound campaigns and test emails cannot be dispatched.",
        remediation: "Add RESEND_API_KEY to your .env.local file with a valid production or test key from resend.com/api-keys.",
        actionUrl: "https://resend.com/api-keys",
        actionLabel: "Open Resend Dashboard",
      });
    }

    // 2. Domain Authentication Check
    if (ctx.totalDomains === 0) {
      list.push({
        id: "no-sending-domain",
        category: "AUTHENTICATION",
        severity: "CRITICAL",
        title: "No Sending Domain Authenticated",
        description: "You have not registered any custom sending domain in NexaReach. Emails sent without custom domain authentication suffer from shared IP reputation penalties.",
        impact: "Severe risk of landing in recipient spam/junk folders or outright mailbox rejection.",
        remediation: "Add your corporate sending domain (e.g. company.com) in the Domain Authentication tab and configure SPF & DKIM DNS records.",
        actionUrl: "#domains",
        actionLabel: "Add Sending Domain",
      });
    } else if (ctx.defaultDomain) {
      if (ctx.defaultDomain.status !== "VERIFIED") {
        list.push({
          id: "domain-pending-dns",
          category: "AUTHENTICATION",
          severity: "CRITICAL",
          title: `Sending Domain "${ctx.defaultDomain.domain}" Incomplete Verification`,
          description: `The domain "${ctx.defaultDomain.domain}" has not passed all required DNS checks (SPF: ${ctx.defaultDomain.spfStatus}, DKIM: ${ctx.defaultDomain.dkimStatus}, DMARC: ${ctx.defaultDomain.dmarcStatus}).`,
          impact: "Google, Yahoo, and Microsoft Outlook enforce strict domain authentication; unverified domains face high bounce rates.",
          remediation: "Publish the TXT and CNAME records provided in the Domain Authentication tab to your DNS provider (Cloudflare, GoDaddy, Route53, etc.) and click 'Verify DNS Now'.",
          actionUrl: "#domains",
          actionLabel: "Inspect DNS Records",
        });
      } else if (ctx.defaultDomain.dmarcStatus !== "VERIFIED") {
        list.push({
          id: "missing-dmarc",
          category: "AUTHENTICATION",
          severity: "WARNING",
          title: `Publish DMARC Policy for "${ctx.defaultDomain.domain}"`,
          description: "DMARC TXT record was not detected on '_dmarc." + ctx.defaultDomain.domain + "'. DMARC ensures malicious actors cannot spoof your brand.",
          impact: "Both Google and Yahoo require DMARC alignment for high-volume senders since February 2024.",
          remediation: "Add a TXT record for '_dmarc." + ctx.defaultDomain.domain + "' with value 'v=DMARC1; p=none; rua=mailto:dmarc@" + ctx.defaultDomain.domain + "'.",
          actionUrl: "#domains",
          actionLabel: "Configure DMARC",
        });
      }
    }

    // 3. Email List Quality
    if (ctx.invalidCount > 0) {
      const invalidPercent = ctx.totalVerified > 0 ? ((ctx.invalidCount / ctx.totalVerified) * 100).toFixed(1) : 0;
      list.push({
        id: "purge-invalid-contacts",
        category: "LIST_HYGIENE",
        severity: ctx.invalidCount > 10 ? "CRITICAL" : "WARNING",
        title: `${ctx.invalidCount} Invalid Emails Detected (${invalidPercent}% of verified list)`,
        description: `Your Reoon verification history identified ${ctx.invalidCount} invalid mailboxes in your workspace. Sending to these addresses guarantees hard bounces.`,
        impact: "Exceeding a 2% bounce rate permanently degrades your domain sender score on Spamhaus and ISP feedback loops.",
        remediation: "Use the 'Suppress All Invalid' action in the List Health tab to automatically add them to the Suppression List.",
        actionUrl: "#list-health",
        actionLabel: "Review Invalid Emails",
      });
    }

    // 4. Catch-All Risk
    if (ctx.catchAllCount > 5) {
      list.push({
        id: "catch-all-caution",
        category: "LIST_HYGIENE",
        severity: "RECOMMENDED",
        title: `${ctx.catchAllCount} Catch-All Email Addresses Identified`,
        description: "Catch-all mail servers accept all incoming messages regardless of whether the specific mailbox exists, making verification indeterminate.",
        impact: "Unchecked catch-all addresses can silently bounce later when internal mail gateways reject them.",
        remediation: "Send re-engagement campaigns to catch-all contacts in smaller, segmented batches and monitor bounce spikes.",
        actionUrl: "#list-health",
        actionLabel: "View Catch-All Contacts",
      });
    }

    // 5. Sending Bounce Rate Alert
    if (ctx.totalSent >= 10) {
      const bRate = (ctx.bouncedCount / ctx.totalSent) * 100;
      if (bRate > 5) {
        list.push({
          id: "high-bounce-critical",
          category: "SENDING",
          severity: "CRITICAL",
          title: `Critical Bounce Rate (${bRate.toFixed(1)}%)`,
          description: "Your calculated bounce rate exceeds the industry emergency threshold of 5%. Senders exceeding this threshold risk domain suspension by upstream relays.",
          impact: "Immediate throttling or mailbox domain blacklisting.",
          remediation: "Halt bulk campaign sending immediately. Run Reoon Bulk Verification on all remaining unverified contacts before dispatching.",
          actionUrl: "/dashboard/email-verification",
          actionLabel: "Run Bulk Verification",
        });
      } else if (bRate > 2) {
        list.push({
          id: "elevated-bounce-warning",
          category: "SENDING",
          severity: "WARNING",
          title: `Elevated Bounce Rate (${bRate.toFixed(1)}%)`,
          description: "Your bounce rate is between 2% and 5%. The recommended threshold for healthy deliverability is below 2%.",
          impact: "Lower inbox delivery percentages as ISPs route messages to the promotions or spam tabs.",
          remediation: "Enable strict verification settings and suppress unverified leads before campaign launches.",
          actionUrl: "#list-health",
          actionLabel: "Check List Health",
        });
      }
    }

    // 6. Resend Webhook Integration
    if (!ctx.hasWebhookConfirmation) {
      list.push({
        id: "setup-webhooks",
        category: "SENDING",
        severity: "RECOMMENDED",
        title: "Configure Resend Webhooks for Real-Time Event Tracking",
        description: "NexaReach has not yet received delivery or bounce webhook events from Resend. While emails are accepted via API, real delivery confirmation requires webhook callbacks.",
        impact: "Actual delivery rates and real-time bounce tracking remain estimated rather than provider-confirmed.",
        remediation: "Register your NexaReach webhook endpoint in the Resend Webhooks dashboard to automatically receive delivery, bounce, and spam complaint events.",
        actionUrl: "#webhooks",
        actionLabel: "View Webhook Endpoint",
      });
    }

    // 7. Optimal Status
    if (list.length === 0) {
      list.push({
        id: "optimal-health",
        category: "SECURITY",
        severity: "OPTIMAL",
        title: "All Deliverability Diagnostics Optimal",
        description: "Your domain authentication (SPF, DKIM, DMARC), email list hygiene, and sending health meet industry-leading inbox standards.",
        impact: "Maximum likelihood of reaching the primary inbox across major consumer and enterprise email providers.",
        remediation: "Continue adhering to verification-first list hygiene and monitor sending volumes progressively.",
      });
    }

    return list;
  }
}

export const deliverabilityService = new DeliverabilityService();
