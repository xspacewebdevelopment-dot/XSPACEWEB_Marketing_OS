import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import * as XLSX from "xlsx";

export * from "@/lib/types/verification-results";
import {
  ResultsQueryOptions,
  CleaningRules,
  DEFAULT_CLEANING_RULES,
} from "@/lib/types/verification-results";

/**
 * Sanitizes cell values to prevent CSV and spreadsheet formula injection (CWE-1236).
 * Any string beginning with =, +, -, @, \t, or \r is prefixed with a single apostrophe.
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Escapes values for safe CSV encoding.
 */
export function escapeCsvField(value: unknown): string {
  const sanitized = sanitizeSpreadsheetCell(value);
  if (
    sanitized.includes(",") ||
    sanitized.includes('"') ||
    sanitized.includes("\n") ||
    sanitized.includes("\r")
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export class ResultsCleaningService {
  /**
   * Builds a Prisma where clause for VerificationResult based on search and filters.
   */
  public buildWhereClause(workspaceId: string, options: ResultsQueryOptions = {}) {
    const where: any = {
      workspaceId,
    };

    if (options.search && options.search.trim()) {
      where.email = {
        contains: options.search.trim(),
        mode: "insensitive",
      };
    }

    if (options.status && options.status !== "ALL") {
      where.status = options.status.toUpperCase();
    }

    if (options.source && options.source !== "ALL") {
      where.source = options.source.toUpperCase();
    }

    if (options.jobId && options.jobId !== "ALL") {
      where.jobId = options.jobId;
    }

    if (options.domain && options.domain.trim()) {
      where.domain = {
        contains: options.domain.trim(),
        mode: "insensitive",
      };
    }

    if (options.providerStatus && options.providerStatus !== "ALL") {
      where.providerStatus = options.providerStatus.toLowerCase();
    }

    if (typeof options.isCatchAll === "boolean") {
      where.isCatchAll = options.isCatchAll;
    }

    if (typeof options.isDisposable === "boolean") {
      where.isDisposable = options.isDisposable;
    }

    if (typeof options.isRoleBased === "boolean") {
      where.isRoleBased = options.isRoleBased;
    }

    if (typeof options.isDeliverable === "boolean") {
      where.isDeliverable = options.isDeliverable;
    }

    if (typeof options.isSpamtrap === "boolean") {
      where.isSpamtrap = options.isSpamtrap;
    }

    if (options.dateFrom || options.dateTo) {
      where.verifiedAt = {};
      if (options.dateFrom) {
        where.verifiedAt.gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        const toDate = new Date(options.dateTo);
        // Include full end date if no time was specified
        if (!options.dateTo.includes("T")) {
          toDate.setHours(23, 59, 59, 999);
        }
        where.verifiedAt.lte = toDate;
      }
    }

    return where;
  }

  /**
   * Retrieves paginated results with server-side sorting and filter support.
   */
  public async getResults(workspaceId: string, options: ResultsQueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(workspaceId, options);

    const allowedSortFields = ["verifiedAt", "email", "status", "overallScore"];
    const sortBy = allowedSortFields.includes(options.sortBy || "")
      ? (options.sortBy as string)
      : "verifiedAt";
    const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

    const [items, total] = await Promise.all([
      prisma.verificationResult.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        include: {
          job: {
            select: {
              id: true,
              filename: true,
              status: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              subscriptionStatus: true,
            },
          },
        },
      }),
      prisma.verificationResult.count({ where }),
    ]);

    const emails = items.map((i) => i.normalizedEmail);
    const existingContacts = await prisma.contact.findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: emails },
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        normalizedEmail: true,
        subscriptionStatus: true,
      },
    });

    const contactMap = new Map(existingContacts.map((c) => [c.normalizedEmail, c]));

    const enrichedItems = items.map((item) => {
      const contact = item.contact || contactMap.get(item.normalizedEmail) || null;
      return {
        ...item,
        contact: contact ? { id: contact.id, name: contact.name, subscriptionStatus: contact.subscriptionStatus } : null,
        hasContact: !!contact,
      };
    });

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Aggregates real database KPI summary metrics, respecting active filters.
   */
  public async getSummary(workspaceId: string, options: ResultsQueryOptions = {}) {
    const where = this.buildWhereClause(workspaceId, options);

    const [
      totalVerified,
      validCount,
      invalidCount,
      riskyCount,
      unknownCount,
      singleCount,
      bulkCount,
      latestResult,
      distinctEmails,
      jobsList,
    ] = await Promise.all([
      prisma.verificationResult.count({ where }),
      prisma.verificationResult.count({ where: { ...where, status: "VALID" } }),
      prisma.verificationResult.count({ where: { ...where, status: "INVALID" } }),
      prisma.verificationResult.count({ where: { ...where, status: "RISKY" } }),
      prisma.verificationResult.count({ where: { ...where, status: "UNKNOWN" } }),
      prisma.verificationResult.count({ where: { ...where, source: "SINGLE" } }),
      prisma.verificationResult.count({ where: { ...where, source: "BULK" } }),
      prisma.verificationResult.findFirst({
        where,
        orderBy: { verifiedAt: "desc" },
        select: { verifiedAt: true },
      }),
      prisma.verificationResult.groupBy({
        by: ["normalizedEmail"],
        where,
      }),
      prisma.verificationJob.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        select: { id: true, filename: true, status: true, totalRecords: true },
      }),
    ]);

    const validityRate =
      totalVerified > 0 ? Number(((validCount / totalVerified) * 100).toFixed(1)) : 0;

    return {
      totalVerified,
      validCount,
      invalidCount,
      riskyCount,
      unknownCount,
      validityRate,
      singleCount,
      bulkCount,
      uniqueEmailsCount: distinctEmails.length,
      latestVerifiedAt: latestResult?.verifiedAt ? latestResult.verifiedAt.toISOString() : null,
      availableJobs: jobsList,
    };
  }

  /**
   * Retrieves comprehensive result details for the slide-over inspection panel.
   */
  public async getResultDetails(id: string, workspaceId: string) {
    const result = await prisma.verificationResult.findFirst({
      where: { id, workspaceId },
      include: {
        job: true,
        contact: true,
      },
    });

    if (!result) {
      return null;
    }

    // Check suppression list for this email
    const suppressionEntry = await prisma.suppressionEntry.findUnique({
      where: {
        workspaceId_normalizedEmail: {
          workspaceId,
          normalizedEmail: result.normalizedEmail,
        },
      },
    });

    return {
      ...result,
      isSuppressed: !!suppressionEntry,
      suppressionReason: suppressionEntry?.reason || null,
    };
  }

  /**
   * Executes the list cleaning engine server-side:
   * Evaluates records against cleaning rules, identifies duplicates, checks suppression,
   * and computes real-time statistics without mutating original verification data.
   */
  public async cleanList(
    workspaceId: string,
    options: {
      filters?: ResultsQueryOptions;
      selectedIds?: string[];
      cleaningRules?: CleaningRules;
    } = {}
  ) {
    const rules: CleaningRules = {
      ...DEFAULT_CLEANING_RULES,
      ...(options.cleaningRules || {}),
    };

    let where: any;
    if (options.selectedIds && options.selectedIds.length > 0) {
      where = {
        workspaceId,
        id: { in: options.selectedIds },
      };
    } else {
      where = this.buildWhereClause(workspaceId, options.filters);
    }

    // Fetch all matching records sorted by verifiedAt desc so latest records take precedence
    const records = await prisma.verificationResult.findMany({
      where,
      orderBy: { verifiedAt: "desc" },
      select: {
        id: true,
        email: true,
        normalizedEmail: true,
        status: true,
        verificationMode: true,
        providerStatus: true,
        providerSubstatus: true,
        reason: true,
        overallScore: true,
        isValidSyntax: true,
        isDisposable: true,
        isCatchAll: true,
        isRoleBased: true,
        isDeliverable: true,
        isSpamtrap: true,
        isDisabled: true,
        hasInboxFull: true,
        isFreeEmail: true,
        domain: true,
        source: true,
        verifiedAt: true,
      },
    });

    const totalOriginal = records.length;

    // Fetch suppression entries in this workspace
    const suppressedEntries = await prisma.suppressionEntry.findMany({
      where: { workspaceId },
      select: { normalizedEmail: true },
    });
    const suppressedSet = new Set(suppressedEntries.map((s) => s.normalizedEmail));

    const seenNormalizedEmails = new Set<string>();
    const eligibleRecords: typeof records = [];
    let duplicateCount = 0;
    let excludedInvalid = 0;
    let excludedRisky = 0;
    let excludedDisposable = 0;
    let excludedCatchAll = 0;
    let excludedRoleBased = 0;
    let excludedUnknown = 0;
    let excludedSuppressed = 0;
    let excludedNonPower = 0;

    for (const record of records) {
      // 1. Deduplication (retain newest record)
      if (rules.removeDuplicates) {
        if (seenNormalizedEmails.has(record.normalizedEmail)) {
          duplicateCount++;
          continue;
        }
        seenNormalizedEmails.add(record.normalizedEmail);
      }

      // 2. Suppression check
      if (rules.excludeSuppressed && suppressedSet.has(record.normalizedEmail)) {
        excludedSuppressed++;
        continue;
      }

      let isExcluded = false;

      // 3. Status and Signal checks
      if (rules.excludeInvalid && (record.status === "INVALID" || record.isDisabled)) {
        excludedInvalid++;
        isExcluded = true;
      }

      if (rules.excludeUnknown && record.status === "UNKNOWN") {
        excludedUnknown++;
        isExcluded = true;
      }

      if (rules.excludeDisposable && record.isDisposable) {
        excludedDisposable++;
        isExcluded = true;
      }

      if (rules.excludeCatchAll && record.isCatchAll) {
        excludedCatchAll++;
        isExcluded = true;
      }

      if (rules.excludeRoleBased && record.isRoleBased) {
        excludedRoleBased++;
        isExcluded = true;
      }

      if (
        rules.excludeRisky &&
        record.status === "RISKY" &&
        !record.isDisposable &&
        !record.isCatchAll &&
        !record.isRoleBased
      ) {
        excludedRisky++;
        isExcluded = true;
      }

      if (rules.onlyPowerMode && record.verificationMode !== "POWER") {
        excludedNonPower++;
        isExcluded = true;
      }

      if (isExcluded) {
        continue;
      }

      eligibleRecords.push(record);
    }

    const totalExcluded =
      totalOriginal - eligibleRecords.length;

    const cleaningPercentage =
      totalOriginal > 0
        ? Number(((totalExcluded / totalOriginal) * 100).toFixed(1))
        : 0;

    return {
      metrics: {
        totalOriginal,
        eligibleCount: eligibleRecords.length,
        duplicateCount,
        excludedInvalid,
        excludedRisky,
        excludedDisposable,
        excludedCatchAll,
        excludedRoleBased,
        excludedUnknown,
        excludedSuppressed,
        excludedNonPower,
        totalExcluded,
        cleaningPercentage,
      },
      rulesApplied: rules,
      eligibleRecords,
    };
  }

  /**
   * Generates CSV or XLSX output with formula injection sanitization.
   */
  public async exportResults(
    workspaceId: string,
    options: {
      format: "csv" | "xlsx";
      exportType: "all" | "filtered" | "selected" | "valid_only" | "cleaned" | "invalid" | "risky" | "unknown";
      selectedIds?: string[];
      cleaningRules?: CleaningRules;
      filters?: ResultsQueryOptions;
    }
  ) {
    let recordsToExport: any[] = [];

    if (options.exportType === "cleaned") {
      const cleaned = await this.cleanList(workspaceId, {
        filters: options.filters,
        selectedIds: options.selectedIds,
        cleaningRules: options.cleaningRules,
      });
      recordsToExport = cleaned.eligibleRecords;
    } else {
      let where = this.buildWhereClause(workspaceId, options.filters);

      if (options.exportType === "selected" && options.selectedIds && options.selectedIds.length > 0) {
        where = {
          workspaceId,
          id: { in: options.selectedIds },
        };
      } else if (options.exportType === "valid_only") {
        where.status = "VALID";
      } else if (options.exportType === "invalid") {
        where.status = "INVALID";
      } else if (options.exportType === "risky") {
        where.status = "RISKY";
      } else if (options.exportType === "unknown") {
        where.status = "UNKNOWN";
      }

      recordsToExport = await prisma.verificationResult.findMany({
        where,
        orderBy: { verifiedAt: "desc" },
        select: {
          id: true,
          email: true,
          status: true,
          providerStatus: true,
          providerSubstatus: true,
          reason: true,
          overallScore: true,
          verificationMode: true,
          isDeliverable: true,
          isDisposable: true,
          isCatchAll: true,
          isRoleBased: true,
          domain: true,
          source: true,
          verifiedAt: true,
        },
      });
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const safeBaseName = `nexareach_${options.exportType}_${timestamp}`;

    if (options.format === "xlsx") {
      const formattedRows = recordsToExport.map((r) => ({
        "Email Address": sanitizeSpreadsheetCell(r.email),
        Status: sanitizeSpreadsheetCell(r.status),
        "Provider Status": sanitizeSpreadsheetCell(r.providerStatus),
        "Provider Substatus": sanitizeSpreadsheetCell(r.providerSubstatus || ""),
        "Quality Score": r.overallScore !== null && r.overallScore !== undefined ? r.overallScore : "",
        "Verification Mode": sanitizeSpreadsheetCell(r.verificationMode || ""),
        Deliverable: r.isDeliverable ? "Yes" : "No",
        Disposable: r.isDisposable ? "Yes" : "No",
        "Catch-All": r.isCatchAll ? "Yes" : "No",
        "Role-Based": r.isRoleBased ? "Yes" : "No",
        Domain: sanitizeSpreadsheetCell(r.domain || ""),
        Source: sanitizeSpreadsheetCell(r.source || "SINGLE"),
        "Verified At": r.verifiedAt ? new Date(r.verifiedAt).toISOString() : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Contacts");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return {
        filename: `${safeBaseName}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer,
        totalExported: recordsToExport.length,
      };
    } else {
      // CSV Export
      const headers = [
        "Email Address",
        "Status",
        "Provider Status",
        "Provider Substatus",
        "Quality Score",
        "Verification Mode",
        "Deliverable",
        "Disposable",
        "Catch-All",
        "Role-Based",
        "Domain",
        "Source",
        "Verified At",
      ];

      const rows = recordsToExport.map((r) => [
        escapeCsvField(r.email),
        escapeCsvField(r.status),
        escapeCsvField(r.providerStatus),
        escapeCsvField(r.providerSubstatus || ""),
        escapeCsvField(r.overallScore ?? ""),
        escapeCsvField(r.verificationMode || ""),
        escapeCsvField(r.isDeliverable ? "Yes" : "No"),
        escapeCsvField(r.isDisposable ? "Yes" : "No"),
        escapeCsvField(r.isCatchAll ? "Yes" : "No"),
        escapeCsvField(r.isRoleBased ? "Yes" : "No"),
        escapeCsvField(r.domain || ""),
        escapeCsvField(r.source || "SINGLE"),
        escapeCsvField(r.verifiedAt ? new Date(r.verifiedAt).toISOString() : ""),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return {
        filename: `${safeBaseName}.csv`,
        contentType: "text/csv; charset=utf-8",
        content: csvContent,
        totalExported: recordsToExport.length,
      };
    }
  }

  /**
   * Adds eligible verified records into the Contacts table:
   * - Normalizes email
   * - Preserves existing marketing consent and suppression
   * - Never auto-subscribes or modifies consent
   * - Updates contactId link on VerificationResult
   */
  public async addResultsToContacts(
    workspaceId: string,
    options: {
      resultIds?: string[];
      cleanedOnly?: boolean;
      cleaningRules?: CleaningRules;
      filters?: ResultsQueryOptions;
      listId?: string;
    }
  ) {
    let eligibleResults: any[] = [];

    if (options.cleanedOnly) {
      const cleaned = await this.cleanList(workspaceId, {
        selectedIds: options.resultIds,
        cleaningRules: options.cleaningRules,
        filters: options.filters,
      });
      eligibleResults = cleaned.eligibleRecords;
    } else if (options.resultIds && options.resultIds.length > 0) {
      eligibleResults = await prisma.verificationResult.findMany({
        where: {
          workspaceId,
          id: { in: options.resultIds },
        },
      });
    } else {
      const where = this.buildWhereClause(workspaceId, options.filters);
      eligibleResults = await prisma.verificationResult.findMany({
        where,
        take: 5000,
      });
    }

    if (eligibleResults.length === 0) {
      return {
        success: true,
        addedCount: 0,
        updatedCount: 0,
        skippedSuppressedCount: 0,
        totalEligible: 0,
      };
    }

    // Check suppression list
    const suppressed = await prisma.suppressionEntry.findMany({
      where: { workspaceId },
      select: { normalizedEmail: true },
    });
    const suppressedSet = new Set(suppressed.map((s) => s.normalizedEmail));

    let addedCount = 0;
    let updatedCount = 0;
    let skippedSuppressedCount = 0;

    // Process each unique normalized email
    const processedMap = new Map<string, typeof eligibleResults[0]>();
    for (const res of eligibleResults) {
      if (!processedMap.has(res.normalizedEmail)) {
        processedMap.set(res.normalizedEmail, res);
      }
    }

    for (const [normEmail, res] of processedMap.entries()) {
      if (suppressedSet.has(normEmail)) {
        skippedSuppressedCount++;
        continue;
      }

      const existingContact = await prisma.contact.findUnique({
        where: {
          workspaceId_normalizedEmail: {
            workspaceId,
            normalizedEmail: normEmail,
          },
        },
      });

      if (existingContact) {
        // Update verification status while preserving existing marketing consent
        const updated = await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            verificationStatus: res.status,
            lastVerifiedAt: res.verifiedAt,
          },
        });

        // Link result to contact
        await prisma.verificationResult.updateMany({
          where: { id: res.id },
          data: { contactId: updated.id },
        });

        updatedCount++;
      } else {
        // Create new contact with PENDING consent - never assume marketing consent from verification!
        const created = await prisma.contact.create({
          data: {
            workspaceId,
            email: res.email,
            normalizedEmail: normEmail,
            verificationStatus: res.status,
            lastVerifiedAt: res.verifiedAt,
            subscriptionStatus: "PENDING",
            lists: options.listId
              ? {
                  create: {
                    listId: options.listId,
                  },
                }
              : undefined,
          },
        });

        await prisma.verificationResult.updateMany({
          where: { id: res.id },
          data: { contactId: created.id },
        });

        addedCount++;
      }
    }

    // If listId provided, also associate existing contacts with the list
    if (options.listId) {
      for (const [normEmail] of processedMap.entries()) {
        const contact = await prisma.contact.findUnique({
          where: { workspaceId_normalizedEmail: { workspaceId, normalizedEmail: normEmail } },
        });
        if (contact) {
          await prisma.contactListMembership
            .upsert({
              where: {
                contactId_listId: {
                  contactId: contact.id,
                  listId: options.listId,
                },
              },
              create: {
                contactId: contact.id,
                listId: options.listId,
              },
              update: {},
            })
            .catch(() => {});
        }
      }
    }

    return {
      success: true,
      addedCount,
      updatedCount,
      skippedSuppressedCount,
      totalEligible: processedMap.size,
    };
  }
}

export const resultsCleaningService = new ResultsCleaningService();
