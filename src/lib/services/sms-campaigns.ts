/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { calculateSmsEncoding } from "@/lib/sms/gsm";
import { parseAndNormalizePhoneNumber } from "@/lib/sms/phone";
import { suppressionService } from "@/lib/services/suppression";
import { fast2SmsProvider } from "@/lib/sms/fast2sms-provider";
import type { SendSmsResult } from "@/lib/sms/provider-interface";

export type SmsExclusionReasonCode =
  | "MISSING_PHONE"
  | "INVALID_PHONE"
  | "CONSENT_PENDING"
  | "EXPLICIT_OPT_OUT"
  | "ACTIVE_SUPPRESSION";

export interface CalculateAudienceParams {
  audienceType: "ALL" | "LIST" | "TEST";
  listId?: string | null;
  testPhone?: string | null;
  messageText?: string;
  encodingPreference?: "AUTO" | "GSM-7" | "UCS-2";
}

export interface SmsAudienceEligibilityResult {
  audienceType: "ALL" | "LIST" | "TEST";
  totalSelected: number;
  eligibleCount: number;
  excludedCount: number;
  exclusionBreakdown: {
    missingPhone: number;
    invalidPhone: number;
    consentPending: number;
    explicitOptOut: number;
    activeSuppression: number;
  };
  eligibleContacts: Array<{
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    phoneNormalized: string | null;
    phoneCountry: string | null;
    email: string;
    smsConsent: string;
  }>;
  excludedContacts: Array<{
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    reasonCode: SmsExclusionReasonCode;
    reasonDescription: string;
  }>;
  estimates: {
    isEstimate: true;
    encoding: "GSM-7" | "UCS-2";
    characterCount: number;
    segmentsPerMessage: number;
    estimatedRecipients: number;
    estimatedTotalSegments: number;
    label: string;
  };
}

export interface CreateSmsBroadcastInput {
  name: string;
  protocol?: "SMS" | "RCS";
  status?: "DRAFT" | "SCHEDULED" | "SENT" | "ARCHIVED";
  senderId?: string;
  messageText: string;
  rcsCardTitle?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
  rcsMediaUrl?: string | null;
  rcsSuggestion?: string | null;
  audienceType?: "ALL" | "LIST" | "TEST";
  listId?: string | null;
  testPhone?: string | null;
  audienceConfig?: any;
  encoding?: "GSM-7" | "UCS-2";
  characterCount?: number;
  segments?: number;
  totalRecipients?: number;
  totalSegments?: number;
  scheduledAt?: Date | null;
}

export interface UpdateSmsBroadcastInput {
  name?: string;
  protocol?: "SMS" | "RCS";
  status?: "DRAFT" | "SCHEDULED" | "SENT" | "ARCHIVED";
  senderId?: string;
  messageText?: string;
  rcsCardTitle?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
  rcsMediaUrl?: string | null;
  rcsSuggestion?: string | null;
  audienceType?: "ALL" | "LIST" | "TEST";
  listId?: string | null;
  testPhone?: string | null;
  audienceConfig?: any;
  encoding?: "GSM-7" | "UCS-2";
  characterCount?: number;
  segments?: number;
  totalRecipients?: number;
  totalSegments?: number;
  scheduledAt?: Date | null;
}

export interface ListSmsBroadcastsOptions {
  status?: string;
  protocol?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class SmsCampaignService {
  /**
   * List all SMS/RCS broadcasts strictly isolated to workspaceId
   */
  public async listBroadcasts(
    workspaceId: string,
    options: ListSmsBroadcastsOptions = {}
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options.protocol && options.protocol !== "ALL") {
      where.protocol = options.protocol;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { senderId: { contains: q, mode: "insensitive" } },
        { messageText: { contains: q, mode: "insensitive" } },
      ];
    }

    const [
      broadcasts,
      total,
      allCount,
      draftCount,
      scheduledCount,
      sentCount,
      archivedCount,
    ] = await Promise.all([
      (prisma as any).smsBroadcast.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      (prisma as any).smsBroadcast.count({ where }),
      (prisma as any).smsBroadcast.count({ where: { workspaceId } }),
      (prisma as any).smsBroadcast.count({ where: { workspaceId, status: "DRAFT" } }),
      (prisma as any).smsBroadcast.count({ where: { workspaceId, status: "SCHEDULED" } }),
      (prisma as any).smsBroadcast.count({ where: { workspaceId, status: "SENT" } }),
      (prisma as any).smsBroadcast.count({ where: { workspaceId, status: "ARCHIVED" } }),
    ]);

    return {
      broadcasts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: allCount,
        draft: draftCount,
        scheduled: scheduledCount,
        sent: sentCount,
        archived: archivedCount,
      },
    };
  }

  /**
   * Retrieve a single broadcast by ID scoped to workspaceId
   */
  public async getBroadcastById(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const broadcast = await (prisma as any).smsBroadcast.findFirst({
      where: { id, workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return broadcast;
  }

  /**
   * Create a new SMS/RCS draft or broadcast scoped to workspaceId
   */
  public async createBroadcast(
    workspaceId: string,
    userId: string | undefined,
    data: CreateSmsBroadcastInput
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const broadcast = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId,
        userId: userId || null,
        name: data.name.trim(),
        protocol: data.protocol || "SMS",
        status: data.status || "DRAFT",
        senderId: data.senderId ? data.senderId.trim().toUpperCase() : "NEXAREACH",
        messageText: data.messageText || "",
        rcsCardTitle: data.rcsCardTitle?.trim() || null,
        rcsActionLabel: data.rcsActionLabel?.trim() || null,
        rcsActionUrl: data.rcsActionUrl?.trim() || null,
        rcsMediaUrl: data.rcsMediaUrl?.trim() || null,
        rcsSuggestion: data.rcsSuggestion?.trim() || null,
        audienceType: data.audienceType || "ALL",
        listId: data.listId?.trim() || null,
        testPhone: data.testPhone?.trim() || null,
        audienceConfig: data.audienceConfig || null,
        encoding: data.encoding || "GSM-7",
        characterCount: data.characterCount ?? 0,
        segments: data.segments ?? 1,
        totalRecipients: data.totalRecipients ?? 0,
        totalSegments: data.totalSegments ?? 0,
        scheduledAt: data.scheduledAt || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return broadcast;
  }

  /**
   * Update an existing broadcast scoped to workspaceId
   */
  public async updateBroadcast(
    id: string,
    workspaceId: string,
    data: UpdateSmsBroadcastInput
  ) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).smsBroadcast.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Broadcast draft not found or access denied.");
    }

    if (existing.status !== "DRAFT") {
      throw new Error("Only draft campaigns can be edited.");
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.protocol !== undefined) updateData.protocol = data.protocol;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.senderId !== undefined) updateData.senderId = data.senderId.trim().toUpperCase();
    if (data.messageText !== undefined) updateData.messageText = data.messageText;
    if (data.rcsCardTitle !== undefined) updateData.rcsCardTitle = data.rcsCardTitle?.trim() || null;
    if (data.rcsActionLabel !== undefined) updateData.rcsActionLabel = data.rcsActionLabel?.trim() || null;
    if (data.rcsActionUrl !== undefined) updateData.rcsActionUrl = data.rcsActionUrl?.trim() || null;
    if (data.rcsMediaUrl !== undefined) updateData.rcsMediaUrl = data.rcsMediaUrl?.trim() || null;
    if (data.rcsSuggestion !== undefined) updateData.rcsSuggestion = data.rcsSuggestion?.trim() || null;
    if (data.audienceType !== undefined) updateData.audienceType = data.audienceType;
    if (data.listId !== undefined) updateData.listId = data.listId?.trim() || null;
    if (data.testPhone !== undefined) updateData.testPhone = data.testPhone?.trim() || null;
    if (data.audienceConfig !== undefined) updateData.audienceConfig = data.audienceConfig;
    if (data.encoding !== undefined) updateData.encoding = data.encoding;
    if (data.characterCount !== undefined) updateData.characterCount = data.characterCount;
    if (data.segments !== undefined) updateData.segments = data.segments;
    if (data.totalRecipients !== undefined) updateData.totalRecipients = data.totalRecipients;
    if (data.totalSegments !== undefined) updateData.totalSegments = data.totalSegments;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;

    const updated = await (prisma as any).smsBroadcast.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a broadcast draft strictly scoped to workspaceId
   */
  public async deleteBroadcast(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).smsBroadcast.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Broadcast draft not found or access denied.");
    }

    if (existing.status !== "DRAFT") {
      throw new Error("Only draft campaigns can be deleted.");
    }

    await (prisma as any).smsBroadcast.delete({
      where: { id },
    });

    return { success: true, deletedId: id };
  }

  /**
   * Server-Side Audience Eligibility & Compliance Calculation Engine.
   * Strictly scopes every query to auth.workspace.id.
   * Enforces international E.164 phone validation, consent checks, and suppression semantics.
   * Calculates estimates only for eligible recipients.
   */
  public async calculateAudienceEligibility(
    workspaceId: string,
    params: CalculateAudienceParams
  ): Promise<SmsAudienceEligibilityResult> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const audienceType = params.audienceType || "ALL";
    const encodingInfo = calculateSmsEncoding(
      params.messageText || "",
      params.encodingPreference || "AUTO"
    );
    const segmentsPerMessage = Math.max(1, encodingInfo.segments || 1);

    const breakdown = {
      missingPhone: 0,
      invalidPhone: 0,
      consentPending: 0,
      explicitOptOut: 0,
      activeSuppression: 0,
    };

    const eligibleContacts: SmsAudienceEligibilityResult["eligibleContacts"] = [];
    const excludedContacts: SmsAudienceEligibilityResult["excludedContacts"] = [];

    // ------------------------------------------------------------------------
    // AUDIENCE TYPE: TEST (DIRECT TEST WORKFLOW)
    // ------------------------------------------------------------------------
    if (audienceType === "TEST") {
      const rawPhone = params.testPhone?.trim() || "";

      if (!rawPhone) {
        breakdown.invalidPhone++;
        excludedContacts.push({
          id: "direct-test",
          name: "Direct Test Recipient",
          email: "",
          phone: null,
          reasonCode: "INVALID_PHONE",
          reasonDescription: "Direct test phone number cannot be empty",
        });
        return {
          audienceType: "TEST",
          totalSelected: 1,
          eligibleCount: 0,
          excludedCount: 1,
          exclusionBreakdown: breakdown,
          eligibleContacts: [],
          excludedContacts,
          estimates: {
            isEstimate: true,
            encoding: encodingInfo.encoding,
            characterCount: encodingInfo.characterCount,
            segmentsPerMessage,
            estimatedRecipients: 0,
            estimatedTotalSegments: 0,
            label: "Estimated recipients (eligible test contacts)",
          },
        };
      }

      const phoneNorm = parseAndNormalizePhoneNumber(rawPhone);
      if (!phoneNorm.isValid || !phoneNorm.e164) {
        breakdown.invalidPhone++;
        excludedContacts.push({
          id: "direct-test",
          name: "Direct Test Recipient",
          email: "",
          phone: rawPhone,
          reasonCode: "INVALID_PHONE",
          reasonDescription: phoneNorm.error || "Phone number is not a valid international dialable number",
        });
        return {
          audienceType: "TEST",
          totalSelected: 1,
          eligibleCount: 0,
          excludedCount: 1,
          exclusionBreakdown: breakdown,
          eligibleContacts: [],
          excludedContacts,
          estimates: {
            isEstimate: true,
            encoding: encodingInfo.encoding,
            characterCount: encodingInfo.characterCount,
            segmentsPerMessage,
            estimatedRecipients: 0,
            estimatedTotalSegments: 0,
            label: "Estimated recipients (eligible test contacts)",
          },
        };
      }

      // Check if this phone number or corresponding contact is in the workspace
      const existingContact = await prisma.contact.findFirst({
        where: {
          workspaceId,
          OR: [
            { phoneNormalized: phoneNorm.e164 },
            { phone: rawPhone },
          ],
        },
      });

      // Check suppression safeguards (Requirement 5)
      const suppression = await suppressionService.isSmsSuppressed(workspaceId, {
        phoneNormalized: phoneNorm.e164,
        email: existingContact?.email,
      });

      if (suppression.isSuppressed) {
        breakdown.activeSuppression++;
        excludedContacts.push({
          id: existingContact?.id || "direct-test",
          name: existingContact?.name || "Direct Test Recipient",
          email: existingContact?.email || "",
          phone: rawPhone,
          reasonCode: "ACTIVE_SUPPRESSION",
          reasonDescription: `Active suppression (${suppression.reason}) blocks messaging to this number`,
        });
      } else if (existingContact?.smsConsent === "OPTED_OUT") {
        breakdown.explicitOptOut++;
        excludedContacts.push({
          id: existingContact.id,
          name: existingContact.name || "Direct Test Recipient",
          email: existingContact.email,
          phone: rawPhone,
          reasonCode: "EXPLICIT_OPT_OUT",
          reasonDescription: "Test recipient has explicitly opted out of SMS broadcasts",
        });
      } else if (existingContact && existingContact.smsConsent === "PENDING") {
        breakdown.consentPending++;
        excludedContacts.push({
          id: existingContact.id,
          name: existingContact.name || "Direct Test Recipient",
          email: existingContact.email,
          phone: rawPhone,
          reasonCode: "CONSENT_PENDING",
          reasonDescription: "SMS consent is pending opt-in verification (test recipients cannot bypass consent)",
        });
      } else if (!existingContact) {
        // Direct test recipient with no documented consent record
        breakdown.consentPending++;
        excludedContacts.push({
          id: "direct-test",
          name: "Direct Test Recipient",
          email: "",
          phone: rawPhone,
          reasonCode: "CONSENT_PENDING",
          reasonDescription: "No verified opt-in consent record found for test phone number",
        });
      } else {
        // Contact exists, has smsConsent === OPTED_IN, not opted out, not suppressed
        eligibleContacts.push({
          id: existingContact.id,
          name: existingContact.name || "Direct Test Recipient",
          firstName: existingContact.firstName,
          lastName: existingContact.lastName,
          phone: rawPhone,
          phoneNormalized: phoneNorm.e164,
          phoneCountry: phoneNorm.country,
          email: existingContact.email,
          smsConsent: existingContact.smsConsent,
        });
      }

      const estimatedTotalSegments = eligibleContacts.length * segmentsPerMessage;

      return {
        audienceType: "TEST",
        totalSelected: 1,
        eligibleCount: eligibleContacts.length,
        excludedCount: excludedContacts.length,
        exclusionBreakdown: breakdown,
        eligibleContacts,
        excludedContacts,
        estimates: {
          isEstimate: true,
          encoding: encodingInfo.encoding,
          characterCount: encodingInfo.characterCount,
          segmentsPerMessage,
          estimatedRecipients: eligibleContacts.length,
          estimatedTotalSegments,
          label: "Telecom delivery estimate based on eligible recipients",
        },
      };
    }

    // ------------------------------------------------------------------------
    // AUDIENCE TYPE: LIST OR ALL
    // ------------------------------------------------------------------------
    let contacts: any[] = [];

    if (audienceType === "LIST") {
      if (!params.listId) {
        throw new Error("A listId is required for LIST audience type");
      }
      // Never trust client listId without verifying workspace ownership
      const list = await prisma.contactList.findFirst({
        where: { id: params.listId, workspaceId },
      });
      if (!list) {
        throw new Error("Contact list not found or access denied in this workspace.");
      }

      contacts = await prisma.contact.findMany({
        where: {
          workspaceId,
          isArchived: false,
          lists: {
            some: { listId: list.id },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // ALL contacts in workspace
      contacts = await prisma.contact.findMany({
        where: {
          workspaceId,
          isArchived: false,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const totalSelected = contacts.length;

    // Fast batch fetch active suppressions for workspace
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
      },
      select: {
        normalizedEmail: true,
        normalizedPhone: true,
        channel: true,
        reason: true,
      },
    });

    const suppressedPhoneSet = new Set<string>();
    const suppressedEmailSmsSet = new Set<string>();

    for (const sup of activeSuppressions) {
      if (sup.normalizedPhone) {
        suppressedPhoneSet.add(sup.normalizedPhone);
      }
      // Apply suppression semantics:
      // Hard bounce, spam complaint, or email unsubscribe under EMAIL channel do NOT suppress SMS.
      // Global DO_NOT_CONTACT, MANUAL_BLOCK, or channel ALL/SMS DO suppress SMS.
      const isEmailOnlyDeliverability =
        sup.channel === "EMAIL" &&
        ["HARD_BOUNCE", "SPAM_COMPLAINT", "UNSUBSCRIBED"].includes(sup.reason);

      if (!isEmailOnlyDeliverability && sup.normalizedEmail) {
        suppressedEmailSmsSet.add(sup.normalizedEmail);
      }
    }

    for (const c of contacts) {
      const rawPhone = c.phone?.trim();

      // Check 1: Missing phone
      if (!rawPhone) {
        breakdown.missingPhone++;
        excludedContacts.push({
          id: c.id,
          name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
          email: c.email,
          phone: null,
          reasonCode: "MISSING_PHONE",
          reasonDescription: "Contact has no phone number on record",
        });
        continue;
      }

      // Check 2: Invalid international phone format
      const norm = parseAndNormalizePhoneNumber(c.phoneNormalized || rawPhone);
      if (!norm.isValid || !norm.e164) {
        breakdown.invalidPhone++;
        excludedContacts.push({
          id: c.id,
          name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
          email: c.email,
          phone: rawPhone,
          reasonCode: "INVALID_PHONE",
          reasonDescription: norm.error || "Phone number is not a valid international dialable number",
        });
        continue;
      }

      // Check 3: Explicit Opt-Out
      if (c.smsConsent === "OPTED_OUT") {
        breakdown.explicitOptOut++;
        excludedContacts.push({
          id: c.id,
          name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
          email: c.email,
          phone: rawPhone,
          reasonCode: "EXPLICIT_OPT_OUT",
          reasonDescription: "Contact has explicitly opted out of SMS broadcasts",
        });
        continue;
      }

      // Check 4: Consent Pending (Never infer opt-in)
      if (c.smsConsent === "PENDING" || c.smsConsent !== "OPTED_IN") {
        breakdown.consentPending++;
        excludedContacts.push({
          id: c.id,
          name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
          email: c.email,
          phone: rawPhone,
          reasonCode: "CONSENT_PENDING",
          reasonDescription: "SMS consent is pending opt-in confirmation",
        });
        continue;
      }

      // Check 5: Active Suppression (Requirement 4: Re-consenting does not override active suppression)
      const phoneBlocked = suppressedPhoneSet.has(norm.e164);
      const emailBlocked = c.normalizedEmail ? suppressedEmailSmsSet.has(c.normalizedEmail) : false;

      if (phoneBlocked || emailBlocked) {
        breakdown.activeSuppression++;
        excludedContacts.push({
          id: c.id,
          name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
          email: c.email,
          phone: rawPhone,
          reasonCode: "ACTIVE_SUPPRESSION",
          reasonDescription: "Active suppression on record blocks SMS broadcast (cannot be bypassed by consent)",
        });
        continue;
      }

      // Eligible recipient!
      eligibleContacts.push({
        id: c.id,
        name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: rawPhone,
        phoneNormalized: norm.e164,
        phoneCountry: norm.country,
        email: c.email,
        smsConsent: c.smsConsent,
      });
    }

    const estimatedRecipients = eligibleContacts.length;
    const estimatedTotalSegments = eligibleContacts.length * segmentsPerMessage;

    return {
      audienceType,
      totalSelected,
      eligibleCount: eligibleContacts.length,
      excludedCount: excludedContacts.length,
      exclusionBreakdown: breakdown,
      eligibleContacts,
      excludedContacts,
      estimates: {
        isEstimate: true,
        encoding: encodingInfo.encoding,
        characterCount: encodingInfo.characterCount,
        segmentsPerMessage,
        estimatedRecipients,
        estimatedTotalSegments,
        label: "Telecom delivery estimate based on eligible recipients",
      },
    };
  }

  /**
   * Executes a single-recipient live test dispatch via Fast2SMS.
   * STRICT SAFEGUARDS:
   * 1. Requires explicit confirmation (confirmLiveSend: true).
   * 2. Enforces active workspace suppression list check.
   * 3. Requires verified SMS opt-in consent (does not bypass consent rules).
   * 4. Enforces Indian (+91) 10-digit mobile number validation.
   * 5. Does NOT mark as DELIVERED upon submission (marks as SUBMITTED_TO_CARRIER).
   * 6. Bulk dispatch remains disabled.
   */
  public async executeSingleTestSend(
    workspaceId: string,
    params: {
      phone: string;
      messageText: string;
      route?: "q" | "dlt";
      senderId?: string;
      dltTemplateId?: string;
      variablesValues?: string;
      confirmLiveSend: boolean;
      attestedConsent?: boolean;
    }
  ): Promise<SendSmsResult & { disclaimer: string; recipientPhone: string; contactId?: string | null }> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    // 1. Explicit live-send confirmation requirement
    if (!params.confirmLiveSend) {
      throw new Error(
        "Live send confirmation required. Set confirmLiveSend to true to authorize billable carrier dispatch."
      );
    }

    if (!params.messageText || !params.messageText.trim()) {
      throw new Error("Message text is required.");
    }

    // 2. Normalize and validate Indian mobile phone
    const norm = parseAndNormalizePhoneNumber(params.phone, "IN");
    if (!norm.isValid || !norm.e164) {
      throw new Error(norm.error || "Invalid recipient phone number");
    }

    if (norm.country !== "IN") {
      throw new Error(
        `Fast2SMS only supports Indian mobile numbers (+91). Recipient country detected: ${
          norm.country || "Unknown"
        }`
      );
    }

    const indianCheck = fast2SmsProvider.normalizeIndianPhone(norm.e164);
    if (!indianCheck.isValid) {
      throw new Error(indianCheck.error || "Invalid Indian mobile number format");
    }

    // 3. Suppression list check (never bypass suppression for test messages)
    const suppressionCheck = await suppressionService.isSmsSuppressed(workspaceId, {
      phoneNormalized: norm.e164,
    });
    if (suppressionCheck.isSuppressed) {
      throw new Error(
        `Recipient ${norm.e164} is actively suppressed on this workspace (${
          suppressionCheck.reason || "ACTIVE_SUPPRESSION"
        }). Live test dispatch is blocked.`
      );
    }

    // 4. Consent check: if contact exists in workspace, must have OPTED_IN status
    const existingContact = await prisma.contact.findFirst({
      where: {
        workspaceId,
        OR: [
          { phoneNormalized: norm.e164 },
          { phone: params.phone.trim() },
        ],
      },
    });

    if (existingContact) {
      if (existingContact.smsConsent !== "OPTED_IN") {
        throw new Error(
          `Contact ${norm.e164} exists in your workspace but SMS consent is '${existingContact.smsConsent}'. An explicit OPTED_IN status is required before sending test messages.`
        );
      }
    } else {
      if (!params.attestedConsent) {
        throw new Error(
          "Explicit opt-in consent confirmation is required for test recipients who are not in your verified contact list."
        );
      }
    }

    // 5. Dispatch via Fast2SmsProvider
    const result = await fast2SmsProvider.sendSms({
      recipientPhone: norm.e164,
      messageText: params.messageText.trim(),
      route: params.route || "q",
      senderId: params.senderId,
      dltTemplateId: params.dltTemplateId,
      variablesValues: params.variablesValues,
      isLive: true,
    });

    return {
      ...result,
      recipientPhone: norm.e164,
      contactId: existingContact?.id || null,
      disclaimer: result.success
        ? "Message successfully submitted to carrier gateway. Final delivery depends on carrier delivery report."
        : "Message submission was rejected or failed at provider gateway.",
    };
  }
}

export const smsCampaignService = new SmsCampaignService();
