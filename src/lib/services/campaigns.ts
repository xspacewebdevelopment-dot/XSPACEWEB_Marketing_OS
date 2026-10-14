import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { resendService } from "@/lib/resend/client";
import { inngest } from "@/inngest/client";
import { listsSegmentsService } from "@/lib/services/lists-segments";
import {
  sanitizeEmailHtml,
  interpolatePersonalization,
  wrapInEmailContainer,
} from "@/lib/templates/compiler";
import type {
  AudienceConfig,
  AudienceBreakdown,
  CampaignType,
  CampaignStatus,
  UTMParams,
  TrackingSettings,
} from "@/lib/types/campaigns";

export class CampaignService {
  /**
   * Helper to append UTM parameters to links inside HTML
   */
  public appendUtmParams(html: string, utm?: UTMParams): string {
    if (!utm || !html) return html;
    const { source, medium, campaign, content } = utm;
    if (!source && !medium && !campaign && !content) return html;

    const utmQueryParts: string[] = [];
    if (source) utmQueryParts.push(`utm_source=${encodeURIComponent(source)}`);
    if (medium) utmQueryParts.push(`utm_medium=${encodeURIComponent(medium)}`);
    if (campaign) utmQueryParts.push(`utm_campaign=${encodeURIComponent(campaign)}`);
    if (content) utmQueryParts.push(`utm_content=${encodeURIComponent(content)}`);

    if (utmQueryParts.length === 0) return html;
    const utmQueryString = utmQueryParts.join("&");

    return html.replace(/href=["'](https?:\/\/[^"']+)["']/gi, (match, url) => {
      // Avoid appending UTM to unsubscribe links or mailto
      if (url.includes("/unsubscribe") || url.startsWith("mailto:")) {
        return match;
      }
      const separator = url.includes("?") ? "&" : "?";
      return `href="${url}${separator}${utmQueryString}"`;
    });
  }

  /**
   * Evaluates and aggregates eligible campaign audience across Contacts, Lists, and Segments.
   * Deduplicates by normalized email and enforces active Suppression List exclusions and consent.
   * NEVER consumes Reoon credits or performs automatic reverification.
   */
  public async calculateAudience(
    workspaceId: string,
    config: AudienceConfig
  ): Promise<AudienceBreakdown> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const contactIds = Array.isArray(config.contactIds) ? config.contactIds : [];
    const listIds = Array.isArray(config.listIds) ? config.listIds : [];
    const segmentIds = Array.isArray(config.segmentIds) ? config.segmentIds : [];
    const excludedListIds = Array.isArray(config.excludedListIds)
      ? config.excludedListIds
      : [];
    const excludedContactIds = Array.isArray(config.excludedContactIds)
      ? config.excludedContactIds
      : [];

    // If nothing selected, return zero breakdown
    if (contactIds.length === 0 && listIds.length === 0 && segmentIds.length === 0) {
      return {
        totalRaw: 0,
        selected: 0,
        duplicates: 0,
        suppressed: 0,
        unsubscribed: 0,
        invalidOrRisky: 0,
        eligible: 0,
        sampleEligible: [],
      };
    }

    // 1. Gather all candidate contacts from the 3 sources
    const rawCandidateContacts: Array<{
      id: string;
      email: string;
      normalizedEmail: string;
      firstName: string | null;
      lastName: string | null;
      name: string | null;
      company: string | null;
      verificationStatus: string;
      subscriptionStatus: string;
      customFields: any;
    }> = [];

    // A. Explicitly selected contacts
    if (contactIds.length > 0) {
      const explicitContacts = await prisma.contact.findMany({
        where: {
          workspaceId,
          id: { in: contactIds },
          isArchived: false,
        },
        select: {
          id: true,
          email: true,
          normalizedEmail: true,
          firstName: true,
          lastName: true,
          name: true,
          company: true,
          verificationStatus: true,
          subscriptionStatus: true,
          customFields: true,
        },
      });
      rawCandidateContacts.push(...explicitContacts);
    }

    // B. Contacts from selected Lists
    if (listIds.length > 0) {
      const listMembers = await prisma.contactListMembership.findMany({
        where: {
          listId: { in: listIds },
          contact: {
            workspaceId,
            isArchived: false,
          },
        },
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              normalizedEmail: true,
              firstName: true,
              lastName: true,
              name: true,
              company: true,
              verificationStatus: true,
              subscriptionStatus: true,
              customFields: true,
            },
          },
        },
      });
      for (const m of listMembers) {
        if (m.contact) rawCandidateContacts.push(m.contact);
      }
    }

    // C. Contacts from Dynamic Segments
    if (segmentIds.length > 0) {
      const segments = await prisma.segment.findMany({
        where: {
          workspaceId,
          id: { in: segmentIds },
        },
      });

      for (const seg of segments) {
        try {
          const segWhere = (listsSegmentsService as any).buildPrismaWhereFromGroup(
            workspaceId,
            seg.conditions as any
          );
          const segmentContacts = await prisma.contact.findMany({
            where: segWhere,
            select: {
              id: true,
              email: true,
              normalizedEmail: true,
              firstName: true,
              lastName: true,
              name: true,
              company: true,
              verificationStatus: true,
              subscriptionStatus: true,
              customFields: true,
            },
          });
          rawCandidateContacts.push(...segmentContacts);
        } catch (err) {
          console.error(`Error querying segment ${seg.id}:`, err);
        }
      }
    }

    const totalRaw = rawCandidateContacts.length;

    // 2. Excluded lists and contacts lookup
    const excludedContactIdSet = new Set(excludedContactIds);
    if (excludedListIds.length > 0) {
      const excludedMemberships = await prisma.contactListMembership.findMany({
        where: { listId: { in: excludedListIds } },
        select: { contactId: true },
      });
      for (const em of excludedMemberships) {
        excludedContactIdSet.add(em.contactId);
      }
    }

    // 3. Deduplicate by normalizedEmail
    const uniqueByEmail = new Map<string, (typeof rawCandidateContacts)[0]>();
    let duplicates = 0;

    for (const contact of rawCandidateContacts) {
      if (excludedContactIdSet.has(contact.id)) {
        continue;
      }
      const norm = contact.normalizedEmail || normalizeEmail(contact.email);
      if (uniqueByEmail.has(norm)) {
        duplicates++;
      } else {
        uniqueByEmail.set(norm, contact);
      }
    }

    const selectedUniqueContacts = Array.from(uniqueByEmail.values());
    const selected = selectedUniqueContacts.length;

    if (selected === 0) {
      return {
        totalRaw,
        selected: 0,
        duplicates,
        suppressed: 0,
        unsubscribed: 0,
        invalidOrRisky: 0,
        eligible: 0,
        sampleEligible: [],
      };
    }

    // 4. Batch query Suppression List for these emails
    const uniqueNormalizedEmails = Array.from(uniqueByEmail.keys());
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: uniqueNormalizedEmails },
        status: "ACTIVE",
      },
      select: { normalizedEmail: true },
    });
    const suppressedEmailSet = new Set(activeSuppressions.map((s) => s.normalizedEmail));

    let suppressed = 0;
    let unsubscribed = 0;
    let invalidOrRisky = 0;
    const eligibleContacts: typeof selectedUniqueContacts = [];

    for (const c of selectedUniqueContacts) {
      const norm = c.normalizedEmail;

      // Check Suppression List
      if (suppressedEmailSet.has(norm)) {
        suppressed++;
        continue;
      }

      // Check Consent / Lawful basis: Unsubscribed or bounced contacts
      if (c.subscriptionStatus === "UNSUBSCRIBED" || c.subscriptionStatus === "BOUNCED") {
        unsubscribed++;
        continue;
      }

      // Check Verification Risk Status: Exclude known Invalid or Risky
      if (c.verificationStatus === "INVALID" || c.verificationStatus === "RISKY") {
        invalidOrRisky++;
        continue;
      }

      eligibleContacts.push(c);
    }

    return {
      totalRaw,
      selected,
      duplicates,
      suppressed,
      unsubscribed,
      invalidOrRisky,
      eligible: eligibleContacts.length,
      sampleEligible: eligibleContacts.slice(0, 20).map((c) => ({
        id: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        name: c.name,
        company: c.company,
        verificationStatus: c.verificationStatus,
        subscriptionStatus: c.subscriptionStatus,
      })),
    };
  }

  /**
   * Materializes the recipient snapshots in PostgreSQL Neon before a campaign dispatches.
   * Ensures idempotency and immutable send-time audience capture.
   */
  public async snapshotRecipients(
    campaignId: string,
    workspaceId: string
  ): Promise<number> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    // Clean existing pending snapshots if resetting
    await prisma.campaignRecipientSnapshot.deleteMany({
      where: {
        campaignId,
        status: "PENDING",
      },
    });

    const audienceConfig = (campaign.audienceConfig as any) || {};
    const audience = await this.calculateAudience(workspaceId, audienceConfig);

    // Fetch the full contact entities for eligible recipients
    const contactIds = Array.isArray(audienceConfig.contactIds) ? audienceConfig.contactIds : [];
    const listIds = Array.isArray(audienceConfig.listIds) ? audienceConfig.listIds : [];
    const segmentIds = Array.isArray(audienceConfig.segmentIds) ? audienceConfig.segmentIds : [];
    const excludedListIds = Array.isArray(audienceConfig.excludedListIds) ? audienceConfig.excludedListIds : [];
    const excludedContactIds = Array.isArray(audienceConfig.excludedContactIds) ? audienceConfig.excludedContactIds : [];

    const excludedSet = new Set(excludedContactIds);
    if (excludedListIds.length > 0) {
      const excludedMembers = await prisma.contactListMembership.findMany({
        where: { listId: { in: excludedListIds } },
        select: { contactId: true },
      });
      for (const em of excludedMembers) excludedSet.add(em.contactId);
    }

    const candidateContacts: Array<any> = [];
    if (contactIds.length > 0) {
      const explicit = await prisma.contact.findMany({
        where: { workspaceId, id: { in: contactIds }, isArchived: false },
      });
      candidateContacts.push(...explicit);
    }
    if (listIds.length > 0) {
      const listMembers = await prisma.contactListMembership.findMany({
        where: { listId: { in: listIds }, contact: { workspaceId, isArchived: false } },
        include: { contact: true },
      });
      for (const lm of listMembers) {
        if (lm.contact) candidateContacts.push(lm.contact);
      }
    }
    if (segmentIds.length > 0) {
      const segments = await prisma.segment.findMany({
        where: { workspaceId, id: { in: segmentIds } },
      });
      for (const seg of segments) {
        try {
          const segWhere = (listsSegmentsService as any).buildPrismaWhereFromGroup(
            workspaceId,
            seg.conditions as any
          );
          const segContacts = await prisma.contact.findMany({ where: segWhere });
          candidateContacts.push(...segContacts);
        } catch {}
      }
    }

    const uniqueMap = new Map<string, any>();
    for (const c of candidateContacts) {
      if (excludedSet.has(c.id)) continue;
      const norm = c.normalizedEmail || normalizeEmail(c.email);
      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, c);
      }
    }

    // Query active suppressions
    const allNormEmails = Array.from(uniqueMap.keys());
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: allNormEmails },
        status: "ACTIVE",
      },
      select: { normalizedEmail: true },
    });
    const suppressedSet = new Set(activeSuppressions.map((s) => s.normalizedEmail));

    const snapshotsToCreate: Array<any> = [];

    for (const [norm, c] of uniqueMap.entries()) {
      if (suppressedSet.has(norm)) continue;
      if (c.subscriptionStatus === "UNSUBSCRIBED" || c.subscriptionStatus === "BOUNCED") continue;
      if (c.verificationStatus === "INVALID" || c.verificationStatus === "RISKY") continue;

      const unsubscribeToken = crypto.randomBytes(24).toString("hex");

      snapshotsToCreate.push({
        campaignId,
        contactId: c.id,
        email: c.email,
        normalizedEmail: norm,
        firstName: c.firstName || (c.name ? c.name.split(" ")[0] : null),
        lastName: c.lastName || (c.name ? c.name.split(" ").slice(1).join(" ") : null),
        company: c.company,
        city: (c.customFields as any)?.city || null,
        customFields: c.customFields || null,
        unsubscribeToken,
        status: "PENDING",
      });
    }

    // Bulk insert snapshot records in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < snapshotsToCreate.length; i += CHUNK_SIZE) {
      const chunk = snapshotsToCreate.slice(i, i + CHUNK_SIZE);
      await prisma.campaignRecipientSnapshot.createMany({
        data: chunk,
      });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalRecipients: snapshotsToCreate.length,
      },
    });

    return snapshotsToCreate.length;
  }

  /**
   * Creates a draft campaign
   */
  public async createCampaign(
    workspaceId: string,
    userId: string,
    payload: any
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    let compiledHtml = payload.compiledHtml || "";
    let editorJson = payload.editorJson || null;

    // If templateId provided, inherit its compiledHtml and editorJson if not supplied
    if (payload.templateId && (!compiledHtml || !editorJson)) {
      const tmpl = await prisma.emailTemplate.findFirst({
        where: { id: payload.templateId, workspaceId },
      });
      if (tmpl) {
        if (!compiledHtml) compiledHtml = tmpl.compiledHtml || "";
        if (!editorJson) editorJson = tmpl.editorJson;
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        userId,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        type: payload.type || "NEWSLETTER",
        status: "DRAFT",
        fromName: payload.fromName.trim(),
        fromEmail: payload.fromEmail.trim().toLowerCase(),
        replyTo: payload.replyTo?.trim()?.toLowerCase() || null,
        subject: payload.subject.trim(),
        preheader: payload.preheader?.trim() || null,
        templateId: payload.templateId || null,
        compiledHtml: compiledHtml || null,
        editorJson: editorJson || null,
        plainText: payload.plainText?.trim() || null,
        audienceConfig: payload.audienceConfig || {},
        utmParams: payload.utmParams || {},
        trackingSettings: payload.trackingSettings || { trackOpens: false, trackClicks: false },
        postalAddress: payload.postalAddress?.trim() || null,
        batchSize: payload.batchSize || 100,
        batchDelayMs: payload.batchDelayMs || 1000,
      },
    });

    return campaign;
  }

  /**
   * Updates an existing campaign
   */
  public async updateCampaign(
    campaignId: string,
    workspaceId: string,
    payload: any
  ) {
    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!existing) throw new Error("Campaign not found");

    if (existing.status === "SENDING" || existing.status === "COMPLETED") {
      throw new Error(`Cannot edit campaign while in ${existing.status} status.`);
    }

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.fromName !== undefined) updateData.fromName = payload.fromName.trim();
    if (payload.fromEmail !== undefined) updateData.fromEmail = payload.fromEmail.trim().toLowerCase();
    if (payload.replyTo !== undefined) updateData.replyTo = payload.replyTo?.trim()?.toLowerCase() || null;
    if (payload.subject !== undefined) updateData.subject = payload.subject.trim();
    if (payload.preheader !== undefined) updateData.preheader = payload.preheader?.trim() || null;
    if (payload.templateId !== undefined) updateData.templateId = payload.templateId || null;
    if (payload.compiledHtml !== undefined) updateData.compiledHtml = payload.compiledHtml;
    if (payload.editorJson !== undefined) updateData.editorJson = payload.editorJson;
    if (payload.plainText !== undefined) updateData.plainText = payload.plainText?.trim() || null;
    if (payload.audienceConfig !== undefined) updateData.audienceConfig = payload.audienceConfig;
    if (payload.utmParams !== undefined) updateData.utmParams = payload.utmParams;
    if (payload.trackingSettings !== undefined) updateData.trackingSettings = payload.trackingSettings;
    if (payload.postalAddress !== undefined) updateData.postalAddress = payload.postalAddress?.trim() || null;
    if (payload.batchSize !== undefined) updateData.batchSize = payload.batchSize;
    if (payload.batchDelayMs !== undefined) updateData.batchDelayMs = payload.batchDelayMs;

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Retrieves single campaign by ID with metrics and audience overview
   */
  public async getCampaignById(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: {
        _count: {
          select: {
            snapshots: true,
            sendingJobs: true,
            events: true,
          },
        },
      },
    });

    if (!campaign) throw new Error("Campaign not found");
    return campaign;
  }

  /**
   * Lists campaigns with pagination, filters, and search
   */
  public async listCampaigns(
    workspaceId: string,
    filters: {
      status?: string;
      type?: string;
      search?: string;
      page?: number;
      limit?: number;
      isArchived?: boolean;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      isArchived: filters.isArchived ?? false,
    };

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters.type && filters.type !== "ALL") {
      where.type = filters.type;
    }

    if (filters.search && filters.search.trim()) {
      where.OR = [
        { name: { contains: filters.search.trim(), mode: "insensitive" } },
        { subject: { contains: filters.search.trim(), mode: "insensitive" } },
        { fromEmail: { contains: filters.search.trim(), mode: "insensitive" } },
      ];
    }

    if (!(prisma as any)?.campaign?.count) {
      return {
        campaigns: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    try {
      const [total, campaigns] = await Promise.all([
        prisma.campaign.count({ where }),
        prisma.campaign.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (queryErr) {
      console.warn("listCampaigns query error:", queryErr);
      return {
        campaigns: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    }
  }

  /**
   * Duplicates a campaign as a new DRAFT
   */
  public async duplicateCampaign(
    campaignId: string,
    workspaceId: string,
    userId: string
  ) {
    const original = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!original) throw new Error("Original campaign not found");

    const duplicated = await prisma.campaign.create({
      data: {
        workspaceId,
        userId,
        name: `${original.name} (Copy)`,
        description: original.description,
        type: original.type,
        status: "DRAFT",
        fromName: original.fromName,
        fromEmail: original.fromEmail,
        replyTo: original.replyTo,
        subject: original.subject,
        preheader: original.preheader,
        templateId: original.templateId,
        compiledHtml: original.compiledHtml,
        editorJson: original.editorJson as any,
        plainText: original.plainText,
        audienceConfig: original.audienceConfig as any,
        utmParams: original.utmParams as any,
        trackingSettings: original.trackingSettings as any,
        postalAddress: original.postalAddress,
        batchSize: original.batchSize,
        batchDelayMs: original.batchDelayMs,
      },
    });

    return duplicated;
  }

  /**
   * Archives a campaign
   */
  public async archiveCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    return prisma.campaign.update({
      where: { id: campaignId },
      data: { isArchived: true, status: "ARCHIVED" },
    });
  }

  /**
   * Deletes a draft, cancelled or archived campaign
   */
  public async deleteCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status === "SENDING") {
      throw new Error("Cannot delete a campaign that is currently sending. Cancel or pause it first.");
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return { success: true, deletedId: campaignId };
  }

  /**
   * Sends a manually initiated test email via real Resend API
   */
  public async sendTestEmail(
    campaignId: string,
    workspaceId: string,
    testEmail: string,
    baseUrl: string = "https://nexareach.com"
  ) {
    if (!testEmail || !testEmail.includes("@")) {
      throw new Error("Valid test recipient email is required");
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    // Sample personalization for test preview
    const sampleData = {
      first_name: "Alex",
      last_name: "Morgan",
      email: testEmail,
      company: "Acme Corporation",
      city: "San Francisco",
      unsubscribe_url: `${baseUrl}/unsubscribe?token=sample-test-token`,
    };

    let bodyHtml = campaign.compiledHtml || "<p>Hello from NexaReach Marketing OS</p>";
    bodyHtml = interpolatePersonalization(bodyHtml, sampleData);

    // Append test banner & unsubscribe footer
    const footerHtml = `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; font-family: sans-serif;">
        <p style="margin: 0 0 6px;">
          [TEST PREVIEW EMAIL] Sent via NexaReach Marketing OS.
        </p>
        <p style="margin: 0 0 6px;">
          ${campaign.postalAddress || "NexaReach Marketing OS, 100 Innovation Way, San Francisco, CA"}
        </p>
        <p style="margin: 0;">
          <a href="${sampleData.unsubscribe_url}" style="color: #3b82f6; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    `;

    bodyHtml += footerHtml;
    const finalHtml = wrapInEmailContainer(bodyHtml, {
      title: campaign.subject,
      preheader: campaign.preheader || undefined,
    });

    const res = await resendService.sendEmail({
      to: testEmail,
      subject: `[TEST] ${campaign.subject}`,
      html: finalHtml,
      from: `${campaign.fromName} <${campaign.fromEmail}>`,
      replyTo: campaign.replyTo || undefined,
    });

    return res;
  }

  /**
   * Schedules a campaign for future dispatch with timezone awareness and UTC persistence
   */
  public async scheduleCampaign(
    campaignId: string,
    workspaceId: string,
    scheduledAtUtc: Date,
    timezone: string = "UTC"
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    if (scheduledAtUtc <= new Date()) {
      throw new Error("Scheduled time must be in the future");
    }

    // Materialize audience snapshot
    const recipientCount = await this.snapshotRecipients(campaignId, workspaceId);
    if (recipientCount === 0) {
      throw new Error("Audience has 0 eligible recipients. Please adjust your lists or segments.");
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SCHEDULED",
        scheduledAt: scheduledAtUtc,
        timezone,
      },
    });

    // Send Inngest event for scheduled dispatch
    try {
      await inngest.send({
        name: "nexareach/campaign.schedule",
        data: {
          campaignId,
          workspaceId,
          scheduledAtUtc: scheduledAtUtc.toISOString(),
        },
      });
    } catch (err) {
      console.warn("Inngest dispatch notice:", err);
    }

    return updated;
  }

  /**
   * Starts sending a campaign immediately
   */
  public async startSending(
    campaignId: string,
    workspaceId: string
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status === "SENDING" || campaign.status === "COMPLETED") {
      throw new Error(`Campaign is already in status: ${campaign.status}`);
    }

    // Materialize audience snapshot if none exists
    const existingSnapshots = await prisma.campaignRecipientSnapshot.count({
      where: { campaignId },
    });
    let totalEligible = existingSnapshots;
    if (existingSnapshots === 0) {
      totalEligible = await this.snapshotRecipients(campaignId, workspaceId);
    }

    if (totalEligible === 0) {
      throw new Error("Cannot send campaign: 0 eligible recipients found after suppression and consent filtering.");
    }

    const idempotencyKey = `send-job-${campaignId}-${Date.now()}`;

    // Create sending job record
    await prisma.campaignSendingJob.create({
      data: {
        campaignId,
        workspaceId,
        idempotencyKey,
        status: "PENDING",
      },
    });

    // Transition campaign to SENDING
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENDING",
        startedAt: new Date(),
        pausedAt: null,
      },
    });

    // Trigger Inngest durable sending job
    try {
      await inngest.send({
        name: "nexareach/campaign.send",
        data: {
          campaignId,
          workspaceId,
        },
      });
    } catch (err) {
      console.warn("Inngest event dispatch notice:", err);
    }

    return updated;
  }

  /**
   * Pauses sending of an in-flight campaign
   */
  public async pauseCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status !== "SENDING" && campaign.status !== "QUEUED") {
      throw new Error(`Campaign is not actively sending (current status: ${campaign.status})`);
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "PAUSED",
        pausedAt: new Date(),
      },
    });

    await prisma.campaignSendingJob.updateMany({
      where: { campaignId, status: "PENDING" },
      data: { status: "PAUSED" },
    });

    return updated;
  }

  /**
   * Resumes sending of a paused campaign
   */
  public async resumeCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status !== "PAUSED") {
      throw new Error(`Campaign is not paused (current status: ${campaign.status})`);
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENDING",
        pausedAt: null,
      },
    });

    await prisma.campaignSendingJob.updateMany({
      where: { campaignId, status: "PAUSED" },
      data: { status: "PENDING" },
    });

    try {
      await inngest.send({
        name: "nexareach/campaign.send",
        data: {
          campaignId,
          workspaceId,
        },
      });
    } catch (err) {
      console.warn("Inngest resume notice:", err);
    }

    return updated;
  }

  /**
   * Cancels a scheduled or sending campaign
   */
  public async cancelCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Mark remaining pending snapshots as EXCLUDED due to cancellation
    await prisma.campaignRecipientSnapshot.updateMany({
      where: { campaignId, status: "PENDING" },
      data: {
        status: "EXCLUDED",
        exclusionReason: "CAMPAIGN_CANCELLED_BY_USER",
      },
    });

    await prisma.campaignSendingJob.updateMany({
      where: { campaignId, status: { in: ["PENDING", "PROCESSING", "PAUSED"] } },
      data: { status: "CANCELLED" },
    });

    return updated;
  }

  /**
   * Processes a single batch of emails for a campaign.
   * Rechecks suppression in real time, personalizes per-recipient HTML, and sends via Resend.
   */
  public async processBatch(
    campaignId: string,
    batchSize: number = 50,
    baseUrl: string = "https://nexareach.com"
  ): Promise<{
    processed: number;
    submitted: number;
    failed: number;
    hasMore: boolean;
  }> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error("Campaign not found");

    // If campaign is no longer in SENDING state, abort immediately
    if (campaign.status !== "SENDING") {
      return { processed: 0, submitted: 0, failed: 0, hasMore: false };
    }

    // Fetch next batch of PENDING snapshots
    const snapshots = await prisma.campaignRecipientSnapshot.findMany({
      where: { campaignId, status: "PENDING" },
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (snapshots.length === 0) {
      // Mark campaign COMPLETED!
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      return { processed: 0, submitted: 0, failed: 0, hasMore: false };
    }

    // Real-time suppression recheck
    const emailsInBatch = snapshots.map((s) => s.normalizedEmail);
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId: campaign.workspaceId,
        normalizedEmail: { in: emailsInBatch },
        status: "ACTIVE",
      },
      select: { normalizedEmail: true },
    });
    const suppressedSet = new Set(activeSuppressions.map((s) => s.normalizedEmail));

    let submittedCount = 0;
    let failedCount = 0;

    const baseHtml = campaign.compiledHtml || "<p>Hello from NexaReach Marketing OS</p>";
    const utmParams = (campaign.utmParams as UTMParams) || undefined;
    const htmlWithUtm = this.appendUtmParams(baseHtml, utmParams);

    for (const snapshot of snapshots) {
      // Check real-time suppression
      if (suppressedSet.has(snapshot.normalizedEmail)) {
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: {
            status: "EXCLUDED",
            exclusionReason: "REALTIME_SUPPRESSION_MATCH",
          },
        });
        continue;
      }

      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${snapshot.unsubscribeToken}`;

      const personalization = {
        first_name: snapshot.firstName || "there",
        last_name: snapshot.lastName || "",
        email: snapshot.email,
        company: snapshot.company || "",
        city: snapshot.city || "",
        unsubscribe_url: unsubscribeUrl,
        ...(snapshot.customFields as any || {}),
      };

      let personalizedBody = interpolatePersonalization(htmlWithUtm, personalization);

      // Append required physical postal address & unsubscribe mechanism
      const postalDisclaimer = `
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; font-family: sans-serif;">
          <p style="margin: 0 0 6px;">${campaign.postalAddress || "NexaReach Marketing OS, 100 Innovation Way, San Francisco, CA"}</p>
          <p style="margin: 0;">
            You received this email because you opted in to updates.
            <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline; margin-left: 6px;">Unsubscribe</a>
          </p>
        </div>
      `;
      personalizedBody += postalDisclaimer;

      const finalClientHtml = wrapInEmailContainer(personalizedBody, {
        title: campaign.subject,
        preheader: campaign.preheader || undefined,
      });

      // Send through real Resend API
      const sendRes = await resendService.sendEmail({
        to: snapshot.email,
        subject: campaign.subject,
        html: finalClientHtml,
        from: `${campaign.fromName} <${campaign.fromEmail}>`,
        replyTo: campaign.replyTo || undefined,
      });

      if (sendRes.success) {
        submittedCount++;
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
            providerMessageId: sendRes.messageId || null,
          },
        });

        await prisma.emailSendingAttempt.create({
          data: {
            campaignId,
            snapshotId: snapshot.id,
            recipientEmail: snapshot.email,
            status: "SUBMITTED",
            provider: "RESEND",
            providerMessageId: sendRes.messageId || null,
          },
        });

        await prisma.emailEvent.create({
          data: {
            campaignId,
            recipientEmail: snapshot.email,
            eventType: "SUBMITTED",
            provider: "RESEND",
            providerMessageId: sendRes.messageId || null,
          },
        });
      } else {
        failedCount++;
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: {
            status: "FAILED",
            errorMessage: sendRes.error || "Provider submission failure",
          },
        });

        await prisma.emailSendingAttempt.create({
          data: {
            campaignId,
            snapshotId: snapshot.id,
            recipientEmail: snapshot.email,
            status: "FAILED",
            provider: "RESEND",
            error: sendRes.error || "Unknown provider error",
          },
        });
      }
    }

    // Update campaign counters in database
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        submittedCount: { increment: submittedCount },
        failedCount: { increment: failedCount },
      },
    });

    const remainingCount = await prisma.campaignRecipientSnapshot.count({
      where: { campaignId, status: "PENDING" },
    });

    if (remainingCount === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    return {
      processed: snapshots.length,
      submitted: submittedCount,
      failed: failedCount,
      hasMore: remainingCount > 0,
    };
  }

  /**
   * Functional Unsubscribe Handler:
   * Immediately records the opt-out in the shared Suppression List and updates Contact subscription status.
   */
  public async handleUnsubscribe(token: string) {
    if (!token) throw new Error("Unsubscribe token is required");

    const snapshot = await prisma.campaignRecipientSnapshot.findUnique({
      where: { unsubscribeToken: token },
      include: { campaign: true },
    });

    if (!snapshot) {
      throw new Error("Invalid or expired unsubscribe link.");
    }

    const { campaignId, email, normalizedEmail, contactId } = snapshot;
    const workspaceId = snapshot.campaign.workspaceId;

    // 1. Mark snapshot status as UNSUBSCRIBED
    await prisma.campaignRecipientSnapshot.update({
      where: { id: snapshot.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // 2. Add or activate in shared Suppression List
    const existingSuppression = await prisma.suppressionEntry.findUnique({
      where: {
        workspaceId_normalizedEmail: {
          workspaceId,
          normalizedEmail,
        },
      },
    });

    if (existingSuppression) {
      await prisma.suppressionEntry.update({
        where: { id: existingSuppression.id },
        data: {
          status: "ACTIVE",
          reason: "UNSUBSCRIBED",
          source: "UNSUBSCRIBE",
          notes: `Recipient clicked unsubscribe link in campaign "${snapshot.campaign.name}"`,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.suppressionEntry.create({
        data: {
          workspaceId,
          email,
          normalizedEmail,
          reason: "UNSUBSCRIBED",
          source: "UNSUBSCRIBE",
          status: "ACTIVE",
          notes: `Recipient clicked unsubscribe link in campaign "${snapshot.campaign.name}"`,
        },
      });
    }

    // 3. Update Contact record if present
    if (contactId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          subscriptionStatus: "UNSUBSCRIBED",
        },
      });
    } else {
      await prisma.contact.updateMany({
        where: { workspaceId, normalizedEmail },
        data: { subscriptionStatus: "UNSUBSCRIBED" },
      });
    }

    // 4. Record EmailEvent
    await prisma.emailEvent.create({
      data: {
        campaignId,
        recipientEmail: email,
        eventType: "UNSUBSCRIBED",
        metadata: {
          campaignName: snapshot.campaign.name,
          token,
        },
      },
    });

    // 5. Increment campaign counter
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        unsubscribedCount: { increment: 1 },
      },
    });

    return {
      success: true,
      email,
      campaignName: snapshot.campaign.name,
    };
  }

  /**
   * Monitor data polling endpoint for real-time progress without fake percentages
   */
  public async getMonitorData(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    const [
      pendingCount,
      submittedCount,
      failedCount,
      excludedCount,
      unsubscribedCount,
      recentErrors,
      recentEvents,
    ] = await Promise.all([
      prisma.campaignRecipientSnapshot.count({
        where: { campaignId, status: "PENDING" },
      }),
      prisma.campaignRecipientSnapshot.count({
        where: { campaignId, status: { in: ["SUBMITTED", "DELIVERED"] } },
      }),
      prisma.campaignRecipientSnapshot.count({
        where: { campaignId, status: "FAILED" },
      }),
      prisma.campaignRecipientSnapshot.count({
        where: { campaignId, status: "EXCLUDED" },
      }),
      prisma.campaignRecipientSnapshot.count({
        where: { campaignId, status: "UNSUBSCRIBED" },
      }),
      prisma.campaignRecipientSnapshot.findMany({
        where: { campaignId, status: "FAILED" },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          email: true,
          errorMessage: true,
          updatedAt: true,
        },
      }),
      prisma.emailEvent.findMany({
        where: { campaignId },
        take: 15,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const total = campaign.totalRecipients || 1;
    const processed = submittedCount + failedCount + excludedCount;
    const progressPercent = Math.min(100, Math.round((processed / total) * 100));

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        type: campaign.type,
        subject: campaign.subject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        scheduledAt: campaign.scheduledAt,
        timezone: campaign.timezone,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
        totalRecipients: campaign.totalRecipients,
      },
      counts: {
        total: campaign.totalRecipients,
        pending: pendingCount,
        submitted: submittedCount,
        failed: failedCount,
        excluded: excludedCount,
        unsubscribed: unsubscribedCount,
        progressPercent,
      },
      recentErrors,
      recentEvents,
    };
  }

  /**
   * Generates campaign report data strictly from stored facts
   */
  public async getCampaignReport(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    const [snapshotsByStatus, hourlySubmissions, recentAttempts] = await Promise.all([
      prisma.campaignRecipientSnapshot.groupBy({
        by: ["status"],
        where: { campaignId },
        _count: { status: true },
      }),
      prisma.$queryRawUnsafe<Array<{ hour: string; count: bigint }>>(`
        SELECT date_trunc('hour', "createdAt") as hour, count(*) as count
        FROM email_events
        WHERE "campaignId" = '${campaignId}' AND "eventType" = 'SUBMITTED'
        GROUP BY 1
        ORDER BY 1 ASC;
      `),
      prisma.emailSendingAttempt.findMany({
        where: { campaignId },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of snapshotsByStatus) {
      statusMap[item.status] = item._count.status;
    }

    return {
      campaign,
      statusBreakdown: statusMap,
      timeline: hourlySubmissions.map((h) => ({
        hour: h.hour,
        count: Number(h.count),
      })),
      recentAttempts,
    };
  }

  /**
   * Generates CSV report string for export
   */
  public async exportReportCsv(campaignId: string, workspaceId: string): Promise<string> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new Error("Campaign not found");

    const snapshots = await prisma.campaignRecipientSnapshot.findMany({
      where: { campaignId },
      orderBy: { createdAt: "asc" },
    });

    const headers = [
      "Recipient Email",
      "First Name",
      "Last Name",
      "Company",
      "Status",
      "Provider Message ID",
      "Submitted At",
      "Delivered At",
      "Opened At",
      "Clicked At",
      "Error Message",
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = snapshots.map((s) => [
      escape(s.email),
      escape(s.firstName),
      escape(s.lastName),
      escape(s.company),
      escape(s.status),
      escape(s.providerMessageId),
      escape(s.submittedAt ? s.submittedAt.toISOString() : ""),
      escape(s.deliveredAt ? s.deliveredAt.toISOString() : ""),
      escape(s.openedAt ? s.openedAt.toISOString() : ""),
      escape(s.clickedAt ? s.clickedAt.toISOString() : ""),
      escape(s.errorMessage),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export const campaignService = new CampaignService();
