/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { parseAndNormalizePhoneNumber } from "@/lib/sms/phone";
import { listsSegmentsService } from "@/lib/services/lists-segments";

export type VoiceExclusionReasonCode =
  | "MISSING_PHONE"
  | "INVALID_PHONE"
  | "CONSENT_PENDING"
  | "EXPLICIT_OPT_OUT"
  | "ACTIVE_SUPPRESSION";

export interface CalculateVoiceAudienceParams {
  audienceType: "ALL" | "LIST" | "SEGMENT" | "TEST";
  listId?: string | null;
  segmentId?: string | null;
  testPhone?: string | null;
  scriptText?: string;
}

export interface VoiceAudienceEligibilityResult {
  audienceType: "ALL" | "LIST" | "SEGMENT" | "TEST";
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
    company: string | null;
    city: string | null;
    phone: string | null;
    phoneNormalized: string | null;
    phoneCountry: string | null;
    voiceConsent: string;
  }>;
  excludedContacts: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    reasonCode: VoiceExclusionReasonCode;
    reasonDescription: string;
  }>;
  estimates: {
    isEstimate: true;
    wordCount: number;
    characterCount: number;
    estimatedDurationSeconds: number; // based on ~130 words per minute average speech rate
    estimatedRecipients: number;
    label: string;
  };
}

export interface CreateVoiceCampaignInput {
  name: string;
  description?: string | null;
  purpose?: string;
  status?: string;
  scriptText: string;
  language?: string;
  voiceId?: string;
  speed?: number;
  pitch?: number;
  audienceType?: "ALL" | "LIST" | "SEGMENT" | "TEST";
  listId?: string | null;
  segmentId?: string | null;
  testPhone?: string | null;
  audienceConfig?: any;
  totalRecipients?: number;
  eligibleCount?: number;
  excludedCount?: number;
  scheduledAt?: Date | null;
  timezone?: string | null;
  templateId?: string | null;
}

export interface UpdateVoiceCampaignInput {
  name?: string;
  description?: string | null;
  purpose?: string;
  status?: string;
  scriptText?: string;
  language?: string;
  voiceId?: string;
  speed?: number;
  pitch?: number;
  audienceType?: "ALL" | "LIST" | "SEGMENT" | "TEST";
  listId?: string | null;
  segmentId?: string | null;
  testPhone?: string | null;
  audienceConfig?: any;
  totalRecipients?: number;
  eligibleCount?: number;
  excludedCount?: number;
  scheduledAt?: Date | null;
  timezone?: string | null;
  templateId?: string | null;
}

export interface ListVoiceCampaignsOptions {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class VoiceCampaignService {
  /**
   * Helper: calculates spoken audio duration estimate (~130 words per minute speaking rate)
   */
  public calculateScriptMetrics(scriptText: string, speed: number = 1.0) {
    const trimmed = (scriptText || "").trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = trimmed.length;
    // Base 130 words per min = ~2.16 words per second, adjusted by speed
    const baseSeconds = words > 0 ? Math.ceil((words / 130) * 60) : 0;
    const estimatedDurationSeconds = Math.max(1, Math.round(baseSeconds / Math.max(0.5, speed || 1.0)));

    return {
      wordCount: words,
      characterCount: characters,
      estimatedDurationSeconds,
    };
  }

  /**
   * Replaces dynamic tags ({{firstName}}, {{company}}, etc.) with contact properties
   */
  public renderVoiceScript(
    scriptText: string,
    contact: {
      firstName?: string | null;
      lastName?: string | null;
      name?: string | null;
      company?: string | null;
      city?: string | null;
      phone?: string | null;
      customFields?: any;
    }
  ): { rendered: string; missingPlaceholders: string[] } {
    let rendered = scriptText || "";
    const missingPlaceholders: string[] = [];

    const map: Record<string, string> = {
      firstName: contact.firstName || contact.name?.split(" ")[0] || "Valued Customer",
      lastName: contact.lastName || "",
      name: contact.name || "Customer",
      company: contact.company || "our team",
      city: contact.city || "your area",
      phone: contact.phone || "",
    };

    // Also include customFields into the map
    if (contact.customFields && typeof contact.customFields === "object") {
      for (const [k, v] of Object.entries(contact.customFields)) {
        if (v !== undefined && v !== null) {
          map[k] = String(v);
        }
      }
    }

    // Replace all known tags
    for (const [key, val] of Object.entries(map)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      rendered = rendered.replace(regex, val);
    }

    // Scan for unreplaced placeholders
    const leftoverRegex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    const matches = rendered.match(leftoverRegex);
    if (matches) {
      for (const m of matches) {
        if (!missingPlaceholders.includes(m)) {
          missingPlaceholders.push(m);
        }
      }
    }

    return { rendered, missingPlaceholders };
  }

  /**
   * List voice campaigns strictly scoped to workspaceId with pagination, search and counts
   */
  public async listCampaigns(workspaceId: string, options: ListVoiceCampaignsOptions = {}) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { scriptText: { contains: q, mode: "insensitive" } },
      ];
    }

    const [
      campaigns,
      total,
      allCount,
      draftCount,
      readyCount,
      scheduledCount,
      queuedCount,
      completedCount,
      cancelledCount,
      failedCount,
    ] = await Promise.all([
      (prisma as any).voiceCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { callJobs: true } },
        },
      }),
      (prisma as any).voiceCampaign.count({ where }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "DRAFT" } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "READY_FOR_REVIEW" } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "SCHEDULED" } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "QUEUED" } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "COMPLETED" } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "CANCELLED" } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "FAILED" } }),
    ]);

    return {
      campaigns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: allCount,
        draft: draftCount,
        ready_for_review: readyCount,
        scheduled: scheduledCount,
        queued: queuedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        failed: failedCount,
      },
    };
  }

  /**
   * Get campaign by ID scoped to workspaceId with full details and metrics
   */
  public async getCampaignById(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const campaign = await (prisma as any).voiceCampaign.findFirst({
      where: { id, workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        callJobs: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
        callEvents: {
          take: 30,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return campaign;
  }

  /**
   * Create voice campaign draft strictly scoped to workspaceId
   */
  public async createCampaign(
    workspaceId: string,
    userId: string | undefined,
    data: CreateVoiceCampaignInput
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!data.name?.trim()) throw new Error("Campaign name is required");
    if (!data.scriptText?.trim()) throw new Error("Script content is required");

    const created = await (prisma as any).voiceCampaign.create({
      data: {
        workspaceId,
        userId: userId || null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        purpose: data.purpose?.toUpperCase() || "NOTIFICATION",
        status: data.status || "DRAFT",
        scriptText: data.scriptText.trim(),
        language: data.language?.trim() || "en-US",
        voiceId: data.voiceId?.trim() || "alloy",
        speed: data.speed !== undefined ? Number(data.speed) : 1.0,
        pitch: data.pitch !== undefined ? Number(data.pitch) : 1.0,
        audienceType: data.audienceType || "ALL",
        listId: data.listId?.trim() || null,
        segmentId: data.segmentId?.trim() || null,
        testPhone: data.testPhone?.trim() || null,
        audienceConfig: data.audienceConfig || null,
        totalRecipients: data.totalRecipients || 0,
        eligibleCount: data.eligibleCount || 0,
        excludedCount: data.excludedCount || 0,
        scheduledAt: data.scheduledAt || null,
        timezone: data.timezone?.trim() || "UTC",
        templateId: data.templateId?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Create initial audit event
    await (prisma as any).voiceCallEvent.create({
      data: {
        workspaceId,
        campaignId: created.id,
        eventType: "CREATED",
        newStatus: created.status,
        notes: `Voice campaign "${created.name}" created as ${created.status}.`,
        isSimulated: true,
      },
    });

    return created;
  }

  /**
   * Update existing campaign. STRICT RULE: Only DRAFT or READY_FOR_REVIEW can be edited.
   */
  public async updateCampaign(
    id: string,
    workspaceId: string,
    data: UpdateVoiceCampaignInput
  ) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).voiceCampaign.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Voice campaign not found or access denied.");
    }

    if (existing.status !== "DRAFT" && existing.status !== "READY_FOR_REVIEW") {
      throw new Error("Only draft campaigns can be edited.");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.purpose !== undefined) updateData.purpose = data.purpose.toUpperCase();
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scriptText !== undefined) updateData.scriptText = data.scriptText.trim();
    if (data.language !== undefined) updateData.language = data.language.trim();
    if (data.voiceId !== undefined) updateData.voiceId = data.voiceId.trim();
    if (data.speed !== undefined) updateData.speed = Number(data.speed);
    if (data.pitch !== undefined) updateData.pitch = Number(data.pitch);
    if (data.audienceType !== undefined) updateData.audienceType = data.audienceType;
    if (data.listId !== undefined) updateData.listId = data.listId?.trim() || null;
    if (data.segmentId !== undefined) updateData.segmentId = data.segmentId?.trim() || null;
    if (data.testPhone !== undefined) updateData.testPhone = data.testPhone?.trim() || null;
    if (data.audienceConfig !== undefined) updateData.audienceConfig = data.audienceConfig;
    if (data.totalRecipients !== undefined) updateData.totalRecipients = data.totalRecipients;
    if (data.eligibleCount !== undefined) updateData.eligibleCount = data.eligibleCount;
    if (data.excludedCount !== undefined) updateData.excludedCount = data.excludedCount;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;
    if (data.timezone !== undefined) updateData.timezone = data.timezone?.trim() || "UTC";
    if (data.templateId !== undefined) updateData.templateId = data.templateId?.trim() || null;

    const updated = await (prisma as any).voiceCampaign.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  }

  /**
   * Delete campaign. STRICT RULE: Only DRAFT campaigns can be deleted.
   */
  public async deleteCampaign(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).voiceCampaign.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Voice campaign not found or access denied.");
    }

    if (existing.status !== "DRAFT") {
      throw new Error("Only draft campaigns can be deleted.");
    }

    await (prisma as any).voiceCampaign.delete({
      where: { id },
    });

    return { success: true, deletedId: id };
  }

  /**
   * Duplicate existing campaign into a new DRAFT
   */
  public async duplicateCampaign(id: string, workspaceId: string, userId?: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const source = await (prisma as any).voiceCampaign.findFirst({
      where: { id, workspaceId },
    });

    if (!source) {
      throw new Error("Source voice campaign not found or access denied.");
    }

    const duplicated = await (prisma as any).voiceCampaign.create({
      data: {
        workspaceId,
        userId: userId || null,
        name: `Copy of ${source.name}`.slice(0, 120),
        description: source.description,
        purpose: source.purpose,
        status: "DRAFT",
        scriptText: source.scriptText,
        language: source.language,
        voiceId: source.voiceId,
        speed: source.speed,
        pitch: source.pitch,
        audienceType: source.audienceType,
        listId: source.listId,
        segmentId: source.segmentId,
        testPhone: source.testPhone,
        audienceConfig: source.audienceConfig,
        totalRecipients: source.totalRecipients,
        eligibleCount: source.eligibleCount,
        excludedCount: source.excludedCount,
        templateId: source.templateId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await (prisma as any).voiceCallEvent.create({
      data: {
        workspaceId,
        campaignId: duplicated.id,
        eventType: "DUPLICATED",
        newStatus: "DRAFT",
        notes: `Duplicated from campaign "${source.name}" (${source.id}).`,
        isSimulated: true,
      },
    });

    return duplicated;
  }

  /**
   * Cancel scheduled or queued campaign
   */
  public async cancelScheduledCampaign(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).voiceCampaign.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Voice campaign not found or access denied.");
    }

    if (existing.status !== "SCHEDULED" && existing.status !== "READY_FOR_REVIEW" && existing.status !== "QUEUED") {
      throw new Error(`Cannot cancel campaign in "${existing.status}" status.`);
    }

    const updated = await (prisma as any).voiceCampaign.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Also cancel any pending/queued jobs
    await (prisma as any).voiceCallJob.updateMany({
      where: { campaignId: id, status: { in: ["PENDING", "QUEUED"] } },
      data: { status: "CANCELLED" },
    });

    await (prisma as any).voiceCallEvent.create({
      data: {
        workspaceId,
        campaignId: id,
        eventType: "STATUS_CHANGED",
        previousStatus: existing.status,
        newStatus: "CANCELLED",
        notes: "Campaign scheduled execution cancelled by user.",
        isSimulated: true,
      },
    });

    return updated;
  }

  /**
   * Server-Side Voice Audience Eligibility & Compliance Engine
   * 
   * Strict Rules:
   * 1. International E.164 phone normalization via libphonenumber-js.
   * 2. Voice-specific consent: Contact.voiceConsent MUST be 'OPTED_IN'.
   *    SMS consent does NOT authorize automated voice calls.
   * 3. Suppression check: SuppressionEntry channel 'VOICE' or 'ALL' with status 'ACTIVE'.
   * 4. Multi-tenant workspace isolation on every single query.
   */
  public async calculateAudienceEligibility(
    workspaceId: string,
    params: CalculateVoiceAudienceParams
  ): Promise<VoiceAudienceEligibilityResult> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const audienceType = params.audienceType || "ALL";
    const scriptMetrics = this.calculateScriptMetrics(params.scriptText || "", 1.0);

    const breakdown = {
      missingPhone: 0,
      invalidPhone: 0,
      consentPending: 0,
      explicitOptOut: 0,
      activeSuppression: 0,
    };

    const eligibleContacts: VoiceAudienceEligibilityResult["eligibleContacts"] = [];
    const excludedContacts: VoiceAudienceEligibilityResult["excludedContacts"] = [];

    // ------------------------------------------------------------------------
    // CASE A: DIRECT TEST WORKFLOW
    // ------------------------------------------------------------------------
    if (audienceType === "TEST") {
      const rawPhone = params.testPhone?.trim() || "";

      if (!rawPhone) {
        breakdown.invalidPhone++;
        excludedContacts.push({
          id: "direct-test",
          name: "Direct Test Recipient",
          phone: null,
          reasonCode: "INVALID_PHONE",
          reasonDescription: "Direct test phone number cannot be empty.",
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
            wordCount: scriptMetrics.wordCount,
            characterCount: scriptMetrics.characterCount,
            estimatedDurationSeconds: scriptMetrics.estimatedDurationSeconds,
            estimatedRecipients: 0,
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
          phone: rawPhone,
          reasonCode: "INVALID_PHONE",
          reasonDescription: phoneNorm.error || "Phone number is not a valid dialable international number.",
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
            wordCount: scriptMetrics.wordCount,
            characterCount: scriptMetrics.characterCount,
            estimatedDurationSeconds: scriptMetrics.estimatedDurationSeconds,
            estimatedRecipients: 0,
            label: "Estimated recipients (eligible test contacts)",
          },
        };
      }

      // Check suppression for this test number
      const suppression = await prisma.suppressionEntry.findFirst({
        where: {
          workspaceId,
          status: "ACTIVE",
          channel: { in: ["VOICE", "ALL"] },
          normalizedPhone: phoneNorm.e164,
        },
      });

      if (suppression) {
        breakdown.activeSuppression++;
        excludedContacts.push({
          id: "direct-test",
          name: "Direct Test Recipient",
          phone: phoneNorm.e164,
          reasonCode: "ACTIVE_SUPPRESSION",
          reasonDescription: "Phone number is on the active voice suppression list.",
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
            wordCount: scriptMetrics.wordCount,
            characterCount: scriptMetrics.characterCount,
            estimatedDurationSeconds: scriptMetrics.estimatedDurationSeconds,
            estimatedRecipients: 0,
            label: "Estimated recipients (eligible test contacts)",
          },
        };
      }

      // Eligible test recipient
      eligibleContacts.push({
        id: "direct-test",
        name: "Direct Test Recipient",
        firstName: "Test",
        lastName: "Recipient",
        company: "Test Organization",
        city: "Test City",
        phone: rawPhone,
        phoneNormalized: phoneNorm.e164,
        phoneCountry: phoneNorm.country,
        voiceConsent: "OPTED_IN",
      });

      return {
        audienceType: "TEST",
        totalSelected: 1,
        eligibleCount: 1,
        excludedCount: 0,
        exclusionBreakdown: breakdown,
        eligibleContacts,
        excludedContacts: [],
        estimates: {
          isEstimate: true,
          wordCount: scriptMetrics.wordCount,
          characterCount: scriptMetrics.characterCount,
          estimatedDurationSeconds: scriptMetrics.estimatedDurationSeconds,
          estimatedRecipients: 1,
          label: "Estimated recipients (eligible test contacts)",
        },
      };
    }

    // ------------------------------------------------------------------------
    // CASE B: CONTACT LIST, DYNAMIC SEGMENT, OR ALL WORKSPACE CONTACTS
    // ------------------------------------------------------------------------
    const contactWhere: any = {
      workspaceId,
      isArchived: false,
    };

    if (audienceType === "LIST" && params.listId) {
      contactWhere.lists = {
        some: { listId: params.listId },
      };
    } else if (audienceType === "SEGMENT" && params.segmentId) {
      const segment = await prisma.segment.findFirst({
        where: { id: params.segmentId, workspaceId },
      });
      if (segment && segment.conditions) {
        const segWhere = (listsSegmentsService as any).buildPrismaWhereFromGroup(
          workspaceId,
          segment.conditions
        );
        Object.assign(contactWhere, segWhere);
      }
    }

    const contacts = await prisma.contact.findMany({
      where: contactWhere,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneNormalized: true,
        phoneCountry: true,
        voiceConsent: true,
        company: true,
        email: true,
        customFields: true,
      },
      take: 1000, // Safe batch limit
    });

    const totalSelected = contacts.length;

    // Fetch active voice/all suppressions in one workspace-scoped query
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
        channel: { in: ["VOICE", "ALL"] },
      },
      select: {
        normalizedEmail: true,
        normalizedPhone: true,
      },
    });

    const suppressedEmails = new Set(activeSuppressions.map((s) => s.normalizedEmail).filter(Boolean));
    const suppressedPhones = new Set(activeSuppressions.map((s) => s.normalizedPhone).filter(Boolean));

    for (const c of contacts) {
      // 1. Missing phone check
      if (!c.phone?.trim()) {
        breakdown.missingPhone++;
        excludedContacts.push({
          id: c.id,
          name: c.name || c.firstName || "Unnamed Contact",
          phone: null,
          reasonCode: "MISSING_PHONE",
          reasonDescription: "Contact does not have a phone number on file.",
        });
        continue;
      }

      // 2. Phone format validation & E.164 normalization
      const parsedPhone = parseAndNormalizePhoneNumber(c.phone);
      if (!parsedPhone.isValid || !parsedPhone.e164) {
        breakdown.invalidPhone++;
        excludedContacts.push({
          id: c.id,
          name: c.name || c.firstName || "Unnamed Contact",
          phone: c.phone,
          reasonCode: "INVALID_PHONE",
          reasonDescription: parsedPhone.error || "Phone number is not valid international format.",
        });
        continue;
      }

      // 3. Voice-Specific Consent Enforcement (Separate from SMS)
      const consent = (c.voiceConsent || "PENDING").toUpperCase();
      if (consent === "OPTED_OUT") {
        breakdown.explicitOptOut++;
        excludedContacts.push({
          id: c.id,
          name: c.name || c.firstName || "Unnamed Contact",
          phone: parsedPhone.e164,
          reasonCode: "EXPLICIT_OPT_OUT",
          reasonDescription: "Recipient has explicitly opted out of automated voice calls.",
        });
        continue;
      }

      if (consent !== "OPTED_IN") {
        breakdown.consentPending++;
        excludedContacts.push({
          id: c.id,
          name: c.name || c.firstName || "Unnamed Contact",
          phone: parsedPhone.e164,
          reasonCode: "CONSENT_PENDING",
          reasonDescription: "Voice consent is pending or unverified. Automated calling requires express opt-in.",
        });
        continue;
      }

      // 4. Suppression List Check
      if (
        suppressedPhones.has(parsedPhone.e164) ||
        (c.email && suppressedEmails.has(c.email.trim().toLowerCase()))
      ) {
        breakdown.activeSuppression++;
        excludedContacts.push({
          id: c.id,
          name: c.name || c.firstName || "Unnamed Contact",
          phone: parsedPhone.e164,
          reasonCode: "ACTIVE_SUPPRESSION",
          reasonDescription: "Contact is actively suppressed on the workspace voice suppression list.",
        });
        continue;
      }

      // 5. Eligible recipient
      eligibleContacts.push({
        id: c.id,
        name: c.name,
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company,
        city: (c.customFields as any)?.city || null,
        phone: c.phone,
        phoneNormalized: parsedPhone.e164,
        phoneCountry: parsedPhone.country,
        voiceConsent: c.voiceConsent,
      });
    }

    const eligibleCount = eligibleContacts.length;
    const excludedCount = excludedContacts.length;

    return {
      audienceType,
      totalSelected,
      eligibleCount,
      excludedCount,
      exclusionBreakdown: breakdown,
      eligibleContacts,
      excludedContacts,
      estimates: {
        isEstimate: true,
        wordCount: scriptMetrics.wordCount,
        characterCount: scriptMetrics.characterCount,
        estimatedDurationSeconds: scriptMetrics.estimatedDurationSeconds,
        estimatedRecipients: eligibleCount,
        label: "Estimated eligible recipients",
      },
    };
  }

  /**
   * Pre-flight Checklist Validation before scheduling or saving
   */
  public async preflightCheck(campaignId: string, workspaceId: string) {
    const campaign = await this.getCampaignById(campaignId, workspaceId);
    if (!campaign) throw new Error("Campaign not found");

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation 1: Campaign Name
    if (!campaign.name?.trim()) {
      errors.push("Campaign name is required.");
    }

    // Validation 2: Script Content & Length
    if (!campaign.scriptText?.trim()) {
      errors.push("Voice script cannot be empty.");
    } else if (campaign.scriptText.trim().length < 15) {
      errors.push("Voice script is too short (minimum 15 characters).");
    } else if (campaign.scriptText.trim().length > 3000) {
      errors.push("Voice script exceeds maximum allowed character limit (3,000 characters).");
    }

    // Validation 3: Audience Eligibility
    const eligibility = await this.calculateAudienceEligibility(workspaceId, {
      audienceType: campaign.audienceType,
      listId: campaign.listId,
      segmentId: campaign.segmentId,
      testPhone: campaign.testPhone,
      scriptText: campaign.scriptText,
    });

    if (eligibility.eligibleCount === 0) {
      errors.push(
        `Audience has 0 eligible recipients (${eligibility.excludedCount} excluded). Verify voice consent and suppression status.`
      );
    } else if (eligibility.excludedCount > 0) {
      warnings.push(
        `${eligibility.excludedCount} contacts excluded due to missing consent, suppression, or invalid phone numbers.`
      );
    }

    // Validation 4: Schedule Validity (if scheduled)
    if (campaign.status === "SCHEDULED" && campaign.scheduledAt) {
      if (new Date(campaign.scheduledAt).getTime() <= Date.now()) {
        errors.push("Scheduled time must be in the future.");
      }
    }

    // Validation 5: Missing placeholder check in script
    const sampleContact = eligibility.eligibleContacts[0] || {
      firstName: "Alex",
      lastName: "Taylor",
      name: "Alex Taylor",
      company: "Acme Corp",
      city: "Metropolis",
      phone: "+15551234567",
    };
    const rendered = this.renderVoiceScript(campaign.scriptText, sampleContact);
    if (rendered.missingPlaceholders.length > 0) {
      warnings.push(
        `Script contains unmapped placeholders: ${rendered.missingPlaceholders.join(", ")}.`
      );
    }

    // Validation 6: External Voice Provider Status Warning
    warnings.push(
      "Provider Status: Not Connected. Internal dry-run and simulation mode active. Real phone calls are disabled."
    );

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      eligibility,
    };
  }

  /**
   * Internal Call Job Generation (Prepares recipient jobs idempotently without duplicate jobs)
   */
  public async generateInternalCallJobs(campaignId: string, workspaceId: string) {
    const campaign = await this.getCampaignById(campaignId, workspaceId);
    if (!campaign) throw new Error("Campaign not found");

    const eligibility = await this.calculateAudienceEligibility(workspaceId, {
      audienceType: campaign.audienceType,
      listId: campaign.listId,
      segmentId: campaign.segmentId,
      testPhone: campaign.testPhone,
      scriptText: campaign.scriptText,
    });

    let createdJobsCount = 0;

    for (const recipient of eligibility.eligibleContacts) {
      if (!recipient.phoneNormalized) continue;

      const rendered = this.renderVoiceScript(campaign.scriptText, recipient);

      // Upsert job to guarantee idempotency and prevent duplicates
      await (prisma as any).voiceCallJob.upsert({
        where: {
          campaignId_destinationPhoneNorm: {
            campaignId,
            destinationPhoneNorm: recipient.phoneNormalized,
          },
        },
        create: {
          campaignId,
          workspaceId,
          contactId: recipient.id === "direct-test" ? null : recipient.id,
          destinationPhone: recipient.phone || recipient.phoneNormalized,
          destinationPhoneNorm: recipient.phoneNormalized,
          countryCode: recipient.phoneCountry || null,
          renderedScript: rendered.rendered,
          status: "QUEUED",
          isSimulated: true,
          scheduledAt: campaign.scheduledAt || null,
        },
        update: {
          renderedScript: rendered.rendered,
          status: "QUEUED",
          scheduledAt: campaign.scheduledAt || null,
        },
      });

      createdJobsCount++;
    }

    // Update campaign counts
    await (prisma as any).voiceCampaign.update({
      where: { id: campaignId },
      data: {
        totalRecipients: eligibility.totalSelected,
        eligibleCount: eligibility.eligibleCount,
        excludedCount: eligibility.excludedCount,
      },
    });

    await (prisma as any).voiceCallEvent.create({
      data: {
        workspaceId,
        campaignId,
        eventType: "QUEUED",
        newStatus: campaign.status,
        notes: `Prepared ${createdJobsCount} internal recipient call jobs for dry-run simulation.`,
        isSimulated: true,
      },
    });

    return { createdJobsCount };
  }
}

export const voiceCampaignService = new VoiceCampaignService();
