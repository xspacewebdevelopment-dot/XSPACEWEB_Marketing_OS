import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import type {
  SuppressionQueryOptions,
  SuppressionStats,
  RecipientEligibilityResult,
  SuppressionReason,
  SuppressionSource,
  SuppressionStatus,
} from "@/lib/types/suppression";

// Basic RFC 5322 regex for fast sanity check
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export class SuppressionService {
  /**
   * Sanitizes spreadsheet cell strings against formula injection (CSV/Excel injection)
   */
  public sanitizeSpreadsheetCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (
      str.startsWith("=") ||
      str.startsWith("+") ||
      str.startsWith("-") ||
      str.startsWith("@") ||
      str.startsWith("\t") ||
      str.startsWith("\r")
    ) {
      return `'${str}`;
    }
    return str;
  }

  public escapeCsvField(val: string): string {
    if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  /**
   * Validate single email format
   */
  public isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim();
    return trimmed.length >= 3 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
  }

  /**
   * Add a single manual or system suppression
   */
  public async addSuppression(
    workspaceId: string,
    data: {
      email: string;
      reason: SuppressionReason;
      notes?: string;
      source?: SuppressionSource;
      addedByUserId?: string;
      addedByUserEmail?: string;
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error("A valid email address is required");
    }

    const normalized = normalizeEmail(data.email);
    const source = data.source || "MANUAL";
    const reason = data.reason || "MANUAL_BLOCK";

    // Check if an existing entry exists for this workspace and email
    const existing = await prisma.suppressionEntry.findUnique({
      where: {
        workspaceId_normalizedEmail: {
          workspaceId,
          normalizedEmail: normalized,
        },
      },
    });

    if (existing && existing.status === "ACTIVE") {
      throw new Error(`Email "${normalized}" is already actively suppressed in this workspace.`);
    }

    let result;
    let action = "ADDED";

    if (existing) {
      // Reactivate previously removed record
      action = "REACTIVATED";
      result = await prisma.suppressionEntry.update({
        where: { id: existing.id },
        data: {
          email: data.email.trim(),
          reason,
          source,
          notes: data.notes?.trim() || null,
          status: "ACTIVE",
          addedByUserId: data.addedByUserId || null,
          addedByUserEmail: data.addedByUserEmail || null,
          removedAt: null,
          removedByUserId: null,
          removedByUserEmail: null,
          removalJustification: null,
        },
      });
    } else {
      // Create new record
      result = await prisma.suppressionEntry.create({
        data: {
          workspaceId,
          email: data.email.trim(),
          normalizedEmail: normalized,
          reason,
          source,
          notes: data.notes?.trim() || null,
          status: "ACTIVE",
          addedByUserId: data.addedByUserId || null,
          addedByUserEmail: data.addedByUserEmail || null,
        },
      });
    }

    // Append to immutable audit log
    await prisma.suppressionAuditLog.create({
      data: {
        workspaceId,
        suppressionId: result.id,
        email: data.email.trim(),
        normalizedEmail: normalized,
        action,
        reason,
        source,
        performedByUserId: data.addedByUserId || null,
        performedByUserEmail: data.addedByUserEmail || null,
        justification: data.notes || null,
      },
    });

    return result;
  }

  /**
   * Bulk import suppressions with duplicate detection and partial reporting
   */
  public async bulkImportSuppressions(
    workspaceId: string,
    payload: {
      entries: Array<{ email: string; reason?: string; notes?: string }>;
      source?: SuppressionSource;
      userId?: string;
      userEmail?: string;
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const { entries, source = "IMPORT", userId, userEmail } = payload;

    const totalRows = entries.length;
    let invalidCount = 0;
    const validMap = new Map<string, { email: string; reason: string; notes?: string }>();

    for (const item of entries) {
      if (!item.email || !this.isValidEmail(item.email)) {
        invalidCount++;
        continue;
      }
      const norm = normalizeEmail(item.email);
      if (!validMap.has(norm)) {
        validMap.set(norm, {
          email: item.email.trim(),
          reason: item.reason || "MANUAL_BLOCK",
          notes: item.notes?.trim(),
        });
      }
    }

    const uniqueValid = Array.from(validMap.values());
    const duplicatesWithinBatch = totalRows - invalidCount - uniqueValid.length;

    // Check existing records in DB for this workspace
    const existingEntries = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: uniqueValid.map((u) => normalizeEmail(u.email)) },
      },
    });

    const existingActiveMap = new Set(
      existingEntries.filter((e) => e.status === "ACTIVE").map((e) => e.normalizedEmail)
    );
    const existingRemovedMap = new Map(
      existingEntries.filter((e) => e.status === "REMOVED").map((e) => [e.normalizedEmail, e.id])
    );

    let importedCount = 0;
    let reactivatedCount = 0;
    let skippedDuplicates = 0;

    const toCreate: Array<{
      workspaceId: string;
      email: string;
      normalizedEmail: string;
      reason: string;
      source: string;
      notes?: string | null;
      status: string;
      addedByUserId?: string | null;
      addedByUserEmail?: string | null;
    }> = [];

    const toReactivateIds: string[] = [];

    for (const item of uniqueValid) {
      const norm = normalizeEmail(item.email);
      if (existingActiveMap.has(norm)) {
        skippedDuplicates++;
        continue;
      }

      if (existingRemovedMap.has(norm)) {
        toReactivateIds.push(existingRemovedMap.get(norm)!);
        reactivatedCount++;
      } else {
        toCreate.push({
          workspaceId,
          email: item.email,
          normalizedEmail: norm,
          reason: item.reason,
          source,
          notes: item.notes || null,
          status: "ACTIVE",
          addedByUserId: userId || null,
          addedByUserEmail: userEmail || null,
        });
        importedCount++;
      }
    }

    // Execute in database
    await prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.suppressionEntry.createMany({
          data: toCreate,
        });
      }

      if (toReactivateIds.length > 0) {
        await tx.suppressionEntry.updateMany({
          where: { id: { in: toReactivateIds } },
          data: {
            status: "ACTIVE",
            source,
            addedByUserId: userId || null,
            addedByUserEmail: userEmail || null,
            removedAt: null,
            removedByUserId: null,
            removedByUserEmail: null,
            removalJustification: null,
          },
        });
      }

      // Log bulk audit summary
      await tx.suppressionAuditLog.create({
        data: {
          workspaceId,
          email: `BULK_IMPORT_${toCreate.length + toReactivateIds.length}_RECORDS`,
          normalizedEmail: `bulk_import_${toCreate.length + toReactivateIds.length}`,
          action: "IMPORTED",
          source,
          performedByUserId: userId || null,
          performedByUserEmail: userEmail || null,
          justification: `Bulk imported ${toCreate.length} new and reactivated ${toReactivateIds.length} suppression entries.`,
          metadata: {
            totalSubmitted: totalRows,
            newlyAdded: toCreate.length,
            reactivated: toReactivateIds.length,
            skippedDuplicates: skippedDuplicates + duplicatesWithinBatch,
            invalidCount,
          },
        },
      });
    });

    return {
      totalRows,
      uniqueCount: uniqueValid.length,
      importedCount: importedCount + reactivatedCount,
      skippedDuplicates: skippedDuplicates + duplicatesWithinBatch,
      invalidCount,
    };
  }

  /**
   * Server-side paginated, sorted and filtered query for suppressions
   */
  public async getSuppressions(workspaceId: string, options: SuppressionQueryOptions = {}) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(5, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    // Status filter (default ACTIVE unless explicitly set to ALL or REMOVED)
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    } else if (!options.status) {
      where.status = "ACTIVE";
    }

    // Reason filter
    if (options.reason && options.reason !== "ALL") {
      where.reason = options.reason;
    }

    // Source filter
    if (options.source && options.source !== "ALL") {
      where.source = options.source;
    }

    // Search query
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      where.OR = [
        { normalizedEmail: { contains: q } },
        { email: { contains: q } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    // Sort order
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";
    const orderBy = { [sortBy]: sortOrder };

    const [entries, total] = await Promise.all([
      prisma.suppressionEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.suppressionEntry.count({ where }),
    ]);

    const emails = entries.map((e) => e.normalizedEmail);
    const contacts = await (prisma.contact as any).findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: emails },
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        normalizedEmail: true,
      },
    });

    const contactMap = new Map(
      (contacts as Array<any>).map((c) => [
        c.normalizedEmail,
        {
          id: c.id,
          name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
        },
      ])
    );

    const enrichedEntries = entries.map((entry) => {
      const contact = contactMap.get(entry.normalizedEmail) || null;
      return {
        ...entry,
        contactId: contact?.id || null,
        contactName: contact?.name || null,
      };
    });

    return {
      entries: enrichedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Real database aggregations for Suppression KPI Cards
   */
  public async getSuppressionStats(workspaceId: string): Promise<SuppressionStats> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const [
      totalSuppressed,
      manualCount,
      autoCount,
      unsubscribedCount,
      hardBouncedCount,
      complaintCount,
    ] = await Promise.all([
      prisma.suppressionEntry.count({
        where: { workspaceId, status: "ACTIVE" },
      }),
      prisma.suppressionEntry.count({
        where: {
          workspaceId,
          status: "ACTIVE",
          source: { in: ["MANUAL", "IMPORT"] },
        },
      }),
      prisma.suppressionEntry.count({
        where: {
          workspaceId,
          status: "ACTIVE",
          source: { in: ["BOUNCE", "COMPLAINT", "UNSUBSCRIBE", "SYSTEM"] },
        },
      }),
      prisma.suppressionEntry.count({
        where: {
          workspaceId,
          status: "ACTIVE",
          reason: "UNSUBSCRIBED",
        },
      }),
      prisma.suppressionEntry.count({
        where: {
          workspaceId,
          status: "ACTIVE",
          reason: "HARD_BOUNCE",
        },
      }),
      prisma.suppressionEntry.count({
        where: {
          workspaceId,
          status: "ACTIVE",
          reason: "SPAM_COMPLAINT",
        },
      }),
    ]);

    return {
      totalSuppressed,
      manualCount,
      autoCount,
      unsubscribedCount,
      hardBouncedCount,
      complaintCount,
    };
  }

  /**
   * Remove a suppression entry with confirmation, audit trail, and compliance guards
   */
  public async removeSuppression(
    workspaceId: string,
    suppressionId: string,
    payload: {
      removedByUserId: string;
      removedByUserEmail?: string;
      justification: string;
      userRole?: string;
      confirmedRenewedConsent?: boolean;
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!suppressionId) throw new Error("Suppression ID is required");
    if (!payload.justification || payload.justification.trim().length < 5) {
      throw new Error("A valid removal justification of at least 5 characters is required");
    }

    const entry = await prisma.suppressionEntry.findFirst({
      where: { id: suppressionId, workspaceId },
    });

    if (!entry) {
      throw new Error("Suppression entry not found in this workspace");
    }

    if (entry.status === "REMOVED") {
      throw new Error("This suppression entry has already been removed");
    }

    // COMPLIANCE GUARD:
    // If the recipient unsubscribed or filed a spam complaint, prevent casual removal
    // unless explicit renewal consent is confirmed.
    if (entry.reason === "UNSUBSCRIBED" || entry.reason === "SPAM_COMPLAINT") {
      if (!payload.confirmedRenewedConsent) {
        throw new Error(
          `Recipient suppression due to "${entry.reason}" cannot be removed without explicit verification of renewed opt-in consent.`
        );
      }
    }

    const updated = await prisma.suppressionEntry.update({
      where: { id: entry.id },
      data: {
        status: "REMOVED",
        removedAt: new Date(),
        removedByUserId: payload.removedByUserId,
        removedByUserEmail: payload.removedByUserEmail || null,
        removalJustification: payload.justification.trim(),
      },
    });

    // Write immutable audit log
    await prisma.suppressionAuditLog.create({
      data: {
        workspaceId,
        suppressionId: entry.id,
        email: entry.email || entry.normalizedEmail,
        normalizedEmail: entry.normalizedEmail,
        action: "REMOVED",
        reason: entry.reason,
        source: entry.source,
        performedByUserId: payload.removedByUserId,
        performedByUserEmail: payload.removedByUserEmail || null,
        justification: payload.justification.trim(),
        metadata: {
          confirmedRenewedConsent: !!payload.confirmedRenewedConsent,
          userRole: payload.userRole || "USER",
        },
      },
    });

    return updated;
  }

  /**
   * Check if a single email is currently suppressed in the workspace
   */
  public async checkSuppression(workspaceId: string, email: string) {
    if (!workspaceId || !email) return false;
    const normalized = normalizeEmail(email);
    const entry = await prisma.suppressionEntry.findFirst({
      where: {
        workspaceId,
        normalizedEmail: normalized,
        status: "ACTIVE",
      },
    });
    return !!entry;
  }

  /**
   * FEATURE 6 — CAMPAIGN SAFETY ENGINE
   * Checks a batch of recipient emails against active workspace suppressions
   * immediately before sending. Returns partitioned eligible vs excluded addresses.
   */
  public async checkRecipientEligibility(
    workspaceId: string,
    recipientEmails: string[]
  ): Promise<RecipientEligibilityResult> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return {
        totalSubmitted: 0,
        eligibleCount: 0,
        excludedCount: 0,
        eligibleEmails: [],
        excludedRecords: [],
      };
    }

    const normalizedMap = new Map<string, string>(); // norm -> original
    for (const email of recipientEmails) {
      if (email && typeof email === "string" && email.trim()) {
        const norm = normalizeEmail(email);
        if (!normalizedMap.has(norm)) {
          normalizedMap.set(norm, email.trim());
        }
      }
    }

    const uniqueNormalized = Array.from(normalizedMap.keys());

    // Query active suppressions in workspace
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
        normalizedEmail: { in: uniqueNormalized },
      },
      select: {
        email: true,
        normalizedEmail: true,
        reason: true,
        source: true,
        createdAt: true,
      },
    });

    const suppressedSet = new Map(
      activeSuppressions.map((s) => [s.normalizedEmail, s])
    );

    const eligibleEmails: string[] = [];
    const excludedRecords: RecipientEligibilityResult["excludedRecords"] = [];

    for (const [norm, original] of normalizedMap.entries()) {
      if (suppressedSet.has(norm)) {
        const sup = suppressedSet.get(norm)!;
        excludedRecords.push({
          email: original,
          normalizedEmail: norm,
          reason: sup.reason,
          source: sup.source,
          suppressedAt: sup.createdAt.toISOString(),
        });
      } else {
        eligibleEmails.push(original);
      }
    }

    return {
      totalSubmitted: recipientEmails.length,
      eligibleCount: eligibleEmails.length,
      excludedCount: excludedRecords.length,
      eligibleEmails,
      excludedRecords,
    };
  }

  /**
   * Export suppressions to CSV with formula-injection sanitization
   */
  public async exportSuppressionsToCsv(
    workspaceId: string,
    options: SuppressionQueryOptions = {}
  ): Promise<{ csvContent: string; rowCount: number }> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const where: any = { workspaceId };
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    } else if (!options.status) {
      where.status = "ACTIVE";
    }

    if (options.reason && options.reason !== "ALL") {
      where.reason = options.reason;
    }

    if (options.source && options.source !== "ALL") {
      where.source = options.source;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      where.OR = [
        { normalizedEmail: { contains: q } },
        { email: { contains: q } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.suppressionEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Email",
      "Normalized Email",
      "Reason",
      "Source",
      "Status",
      "Internal Note",
      "Added Date",
      "Added By",
      "Removed Date",
      "Removed By",
      "Removal Justification",
    ];

    const rows: string[] = [headers.map((h) => this.escapeCsvField(h)).join(",")];

    for (const e of entries) {
      const email = this.sanitizeSpreadsheetCell(e.email || e.normalizedEmail);
      const normEmail = this.sanitizeSpreadsheetCell(e.normalizedEmail);
      const reason = this.sanitizeSpreadsheetCell(e.reason);
      const source = this.sanitizeSpreadsheetCell(e.source);
      const status = this.sanitizeSpreadsheetCell(e.status);
      const note = this.sanitizeSpreadsheetCell(e.notes || "");
      const addedDate = e.createdAt ? e.createdAt.toISOString() : "";
      const addedBy = this.sanitizeSpreadsheetCell(e.addedByUserEmail || "");
      const removedDate = e.removedAt ? e.removedAt.toISOString() : "";
      const removedBy = this.sanitizeSpreadsheetCell(e.removedByUserEmail || "");
      const just = this.sanitizeSpreadsheetCell(e.removalJustification || "");

      const row = [
        email,
        normEmail,
        reason,
        source,
        status,
        note,
        addedDate,
        addedBy,
        removedDate,
        removedBy,
        just,
      ].map((cell) => this.escapeCsvField(cell));

      rows.push(row.join(","));
    }

    return {
      csvContent: "\uFEFF" + rows.join("\r\n"),
      rowCount: entries.length,
    };
  }

  /**
   * Get audit log history for a suppression entry
   */
  public async getSuppressionAuditHistory(workspaceId: string, normalizedEmail: string) {
    if (!workspaceId || !normalizedEmail) return [];
    return prisma.suppressionAuditLog.findMany({
      where: {
        workspaceId,
        normalizedEmail: normalizeEmail(normalizedEmail),
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const suppressionService = new SuppressionService();
