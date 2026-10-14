import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { reoonClient, ReoonProviderError } from "@/lib/reoon/client";
import { inngest } from "@/inngest/client";
import {
  NormalizedVerificationDetails,
  VerificationDepth,
} from "@/lib/reoon/types";

// In-memory sliding window rate limiter
interface RateLimitBucket {
  timestamps: number[];
}

const workspaceRateLimits = new Map<string, RateLimitBucket>();
const userRateLimits = new Map<string, RateLimitBucket>();
const activeVerifications = new Set<string>();

const WORKSPACE_MAX_PER_MINUTE = 30;
const USER_MAX_PER_MINUTE = 15;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(key: string, map: Map<string, RateLimitBucket>, maxAllowed: number): boolean {
  const now = Date.now();
  let bucket = map.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    map.set(key, bucket);
  }

  // Filter out timestamps older than 1 minute
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (bucket.timestamps.length >= maxAllowed) {
    return false;
  }

  bucket.timestamps.push(now);
  return true;
}

export class VerificationServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = "VERIFICATION_ERROR"
  ) {
    super(message);
    this.name = "VerificationServiceError";
  }
}

export interface VerifySingleOptions {
  workspaceId: string;
  userId: string;
  email: string;
  mode: VerificationDepth;
}

export class VerificationService {
  /**
   * Executes real email verification exclusively using the live Reoon API:
   * 1. Rate limiting & concurrency guard
   * 2. Reoon credit availability check
   * 3. Calls Reoon provider directly
   * 4. Persists to Neon PostgreSQL (VerificationResult & VerificationCreditLedger)
   * 5. Safely synchronizes existing Contact without touching marketing consent
   */
  public async verifySingle(options: VerifySingleOptions): Promise<NormalizedVerificationDetails> {
    const { workspaceId, userId, email, mode } = options;

    const trimmed = (email || "").trim();
    if (!trimmed) {
      throw new VerificationServiceError("Email address is required", 400, "EMPTY_EMAIL");
    }

    if (trimmed.length > 254) {
      throw new VerificationServiceError("Email address exceeds maximum length of 254 characters", 400, "EMAIL_TOO_LONG");
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
      throw new VerificationServiceError("Invalid email address syntax", 400, "INVALID_SYNTAX");
    }

    const normalized = normalizeEmail(trimmed);
    const lockKey = `${workspaceId}:${normalized}`;

    // Concurrency / Duplicate-click guard
    if (activeVerifications.has(lockKey)) {
      throw new VerificationServiceError(
        "A verification for this email address is already currently being processed. Please wait.",
        429,
        "DUPLICATE_CONCURRENT"
      );
    }

    // Rate limits
    if (!checkRateLimit(workspaceId, workspaceRateLimits, WORKSPACE_MAX_PER_MINUTE)) {
      throw new VerificationServiceError(
        "Workspace verification rate limit exceeded (maximum 30 requests per minute). Please wait a moment.",
        429,
        "WORKSPACE_RATE_LIMIT"
      );
    }

    if (!checkRateLimit(userId, userRateLimits, USER_MAX_PER_MINUTE)) {
      throw new VerificationServiceError(
        "User verification rate limit exceeded (maximum 15 requests per minute). Please wait a moment.",
        429,
        "USER_RATE_LIMIT"
      );
    }

    activeVerifications.add(lockKey);

    try {
      // Verify credit balance before requesting paid verification
      const balance = await reoonClient.getAccountBalance();
      if (balance.totalCreditsRemaining !== null && balance.totalCreditsRemaining <= 0) {
        throw new VerificationServiceError(
          "Insufficient Reoon credits available to perform verification. Please replenish your provider account.",
          402,
          "INSUFFICIENT_CREDITS"
        );
      }

      // Execute live verification via Reoon provider
      const result = await reoonClient.verifySingle(trimmed, mode);

      // Persist to Neon PostgreSQL
      const dbResult = await prisma.verificationResult.create({
        data: {
          workspace: { connect: { id: workspaceId } },
          ...(userId ? { user: { connect: { id: userId } } } : {}),
          email: trimmed,
          normalizedEmail: normalized,
          status: result.status,
          provider: "REOON",
          verificationMode: mode,
          providerStatus: result.providerStatus,
          providerSubstatus: result.providerSubstatus,
          reason: result.reason,
          overallScore: result.overallScore,
          isValidSyntax: result.isValidSyntax,
          isDisposable: result.isDisposable,
          isRoleBased: result.isRoleBased,
          isCatchAll: result.isCatchAll,
          mxAcceptsMail: result.mxAcceptsMail,
          canConnectSmtp: result.canConnectSmtp,
          isDeliverable: result.isDeliverable,
          isSpamtrap: result.isSpamtrap,
          isDisabled: result.isDisabled,
          hasInboxFull: result.hasInboxFull,
          isFreeEmail: result.isFreeEmail,
          domain: result.domain,
          mxRecords: result.mxRecords,
          providerResponse: result.rawResponse as any,
          source: "SINGLE",
          verifiedAt: new Date(result.verifiedAt),
        },
      });

      result.id = dbResult.id;

      // Record credit audit ledger entry
      await prisma.verificationCreditLedger.create({
        data: {
          workspace: { connect: { id: workspaceId } },
          ...(userId ? { user: { connect: { id: userId } } } : {}),
          provider: "REOON",
          operation: "SINGLE_VERIFY",
          creditsUsed: 1,
          providerReference: dbResult.id,
        },
      });

      // Contact synchronization:
      // 1. Live provider results update matching contact verification status.
      // 2. Prevent lower-confidence Quick results from overwriting recent Power results (within 30 days).
      // 3. Marketing subscription status & suppression are PRESERVED independently.
      // 4. Never automatically create a marketing contact simply because an email was verified.
      const existingContact = await prisma.contact.findUnique({
        where: {
          workspaceId_normalizedEmail: {
            workspaceId,
            normalizedEmail: normalized,
          },
        },
      });

      if (existingContact) {
        let shouldUpdate = true;

        if (mode === "QUICK" && existingContact.lastVerifiedAt) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if (existingContact.lastVerifiedAt > thirtyDaysAgo) {
            const prevPowerResult = await prisma.verificationResult.findFirst({
              where: {
                workspaceId,
                normalizedEmail: normalized,
                verificationMode: "POWER",
              },
              orderBy: { verifiedAt: "desc" },
            });

            if (prevPowerResult) {
              shouldUpdate = false;
            }
          }
        }

        if (shouldUpdate) {
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              verificationStatus: result.status,
              lastVerifiedAt: new Date(),
            },
          });

          await prisma.verificationResult.update({
            where: { id: dbResult.id },
            data: { contactId: existingContact.id },
          });

          result.contactUpdated = true;
        }
      }

      return result;
    } catch (err: unknown) {
      if (err instanceof VerificationServiceError) {
        throw err;
      }
      if (err instanceof ReoonProviderError) {
        throw new VerificationServiceError(err.message, err.statusCode || 500, err.code || "PROVIDER_ERROR");
      }
      const message = err instanceof Error ? err.message : "Internal verification error";
      throw new VerificationServiceError(message, 500, "INTERNAL_ERROR");
    } finally {
      activeVerifications.delete(lockKey);
    }
  }

  /**
   * Retrieves recent single verifications for a workspace with pagination.
   */
  public async getRecentVerifications(
    workspaceId: string,
    options: { page?: number; limit?: number; search?: string }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      source: "SINGLE",
    };

    if (options.search && options.search.trim()) {
      where.email = {
        contains: options.search.trim(),
        mode: "insensitive",
      };
    }

    const [items, total] = await Promise.all([
      prisma.verificationResult.findMany({
        where,
        orderBy: { verifiedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          status: true,
          verificationMode: true,
          overallScore: true,
          providerStatus: true,
          providerSubstatus: true,
          reason: true,
          isDisposable: true,
          isRoleBased: true,
          isCatchAll: true,
          isDeliverable: true,
          canConnectSmtp: true,
          domain: true,
          verifiedAt: true,
        },
      }),
      prisma.verificationResult.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Creates and submits a bulk email verification job.
   * 1. Validates credit requirements and list parameters.
   * 2. Persists VerificationJob in Neon PostgreSQL.
   * 3. Submits task directly to Reoon bulk endpoint.
   * 4. Enqueues Inngest background event for durable polling & completion.
   */
  public async createBulkJob(options: {
    workspaceId: string;
    userId?: string;
    filename: string;
    sourceType?: string;
    emails: string[];
    duplicatesCount?: number;
    rejectedCount?: number;
    fileSize?: number;
  }) {
    const {
      workspaceId,
      userId,
      filename,
      sourceType = "CSV",
      emails,
      duplicatesCount = 0,
      rejectedCount = 0,
      fileSize,
    } = options;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new VerificationServiceError(
        "At least one email address is required for bulk verification",
        400,
        "EMPTY_LIST"
      );
    }

    if (emails.length > 50000) {
      throw new VerificationServiceError(
        "Bulk verification exceeds the maximum supported limit of 50,000 emails per task",
        400,
        "LIMIT_EXCEEDED"
      );
    }

    // 1. Credit Pre-check
    const balance = await reoonClient.getAccountBalance();
    if (balance.totalCreditsRemaining !== null && balance.totalCreditsRemaining < emails.length) {
      throw new VerificationServiceError(
        `Insufficient Reoon credits to verify ${emails.length} emails. Available: ${balance.totalCreditsRemaining}`,
        402,
        "INSUFFICIENT_CREDITS"
      );
    }

    // 2. Concurrency guard: max 5 active jobs per workspace
    const activeJobsCount = await prisma.verificationJob.count({
      where: {
        workspaceId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (activeJobsCount >= 5) {
      throw new VerificationServiceError(
        "Workspace has reached the maximum of 5 concurrent bulk verification jobs. Please wait for an existing job to complete.",
        429,
        "CONCURRENCY_LIMIT"
      );
    }

    // 3. Create initial VerificationJob in Neon PostgreSQL
    const job = await prisma.verificationJob.create({
      data: {
        workspaceId,
        userId: userId || null,
        filename: filename.slice(0, 200),
        fileSize: fileSize || null,
        sourceType,
        status: "PENDING",
        totalRecords: emails.length,
        processedRecords: 0,
        duplicatesCount,
        rejectedCount,
        progressPercentage: 0,
      },
    });

    // 4. Submit to Reoon Provider
    try {
      const reoonRes = await reoonClient.createBulkTask(emails, filename.slice(0, 25));
      const providerJobId = String(reoonRes.task_id);

      const processingJob = await prisma.verificationJob.update({
        where: { id: job.id },
        data: {
          status: "PROCESSING",
          providerJobId,
        },
      });

      // 5. Trigger durable background workflow in Inngest
      try {
        await inngest.send({
          name: "nexareach/bulk.verify.process",
          data: {
            jobId: job.id,
            workspaceId,
            userId,
            filename,
            providerJobId,
            totalRecords: emails.length,
          },
        });
      } catch (inngestErr) {
        console.warn("Inngest dispatch notice:", inngestErr);
      }

      return processingJob;
    } catch (reoonErr: unknown) {
      const errorMsg =
        reoonErr instanceof Error ? reoonErr.message : "Provider bulk submission failed";

      await prisma.verificationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: errorMsg,
        },
      });

      if (reoonErr instanceof ReoonProviderError) {
        throw new VerificationServiceError(
          reoonErr.message,
          reoonErr.statusCode || 500,
          reoonErr.code || "PROVIDER_ERROR"
        );
      }
      throw new VerificationServiceError(errorMsg, 500, "PROVIDER_SUBMISSION_FAILED");
    }
  }

  /**
   * Synchronizes job status against the Reoon provider.
   * If task has finished on provider, parses and saves results in Neon PostgreSQL.
   */
  public async pollJobStatus(jobId: string, workspaceId: string) {
    const job = await prisma.verificationJob.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new VerificationServiceError("Verification job not found", 404, "JOB_NOT_FOUND");
    }

    if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
      return job;
    }

    if (!job.providerJobId) {
      return job;
    }

    try {
      const progress = await reoonClient.getBulkTaskProgress(job.providerJobId);

      if (progress.status === "FAILED") {
        return await prisma.verificationJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            errorMessage: progress.error || "Provider reported failure",
          },
        });
      }

      if (progress.status === "COMPLETED" && progress.results) {
        return await this.finalizeJobResults(job, progress.results);
      }

      // Update in-progress counters
      return await prisma.verificationJob.update({
        where: { id: job.id },
        data: {
          status: "PROCESSING",
          processedRecords: progress.countProcessed,
          progressPercentage: progress.progressPercentage,
        },
      });
    } catch (err: unknown) {
      if (err instanceof ReoonProviderError && err.code === "RATE_LIMITED") {
        // Return existing job state without failing the job
        return job;
      }
      throw err;
    }
  }

  /**
   * Finalizes completed bulk results: writes to VerificationResult, updates Contact,
   * updates credit ledger, and updates VerificationJob summary counts.
   */
  public async finalizeJobResults(
    job: { id: string; workspaceId: string; userId: string | null },
    results: NormalizedVerificationDetails[]
  ) {
    let validCount = 0;
    let invalidCount = 0;
    let riskyCount = 0;
    let unknownCount = 0;

    for (const r of results) {
      if (r.status === "VALID") validCount++;
      else if (r.status === "INVALID") invalidCount++;
      else if (r.status === "RISKY") riskyCount++;
      else unknownCount++;
    }

    // Chunked batch insertions into Neon PostgreSQL (500 items per chunk)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
      const chunk = results.slice(i, i + CHUNK_SIZE);
      await prisma.verificationResult.createMany({
        data: chunk.map((r) => ({
          workspaceId: job.workspaceId,
          jobId: job.id,
          userId: job.userId,
          email: r.email,
          normalizedEmail: r.normalizedEmail,
          status: r.status,
          provider: "REOON",
          verificationMode: "POWER",
          providerStatus: r.providerStatus,
          providerSubstatus: r.providerSubstatus,
          reason: r.reason,
          overallScore: r.overallScore,
          isValidSyntax: r.isValidSyntax,
          isDisposable: r.isDisposable,
          isRoleBased: r.isRoleBased,
          isCatchAll: r.isCatchAll,
          mxAcceptsMail: r.mxAcceptsMail,
          canConnectSmtp: r.canConnectSmtp,
          isDeliverable: r.isDeliverable,
          isSpamtrap: r.isSpamtrap,
          isDisabled: r.isDisabled,
          hasInboxFull: r.hasInboxFull,
          isFreeEmail: r.isFreeEmail,
          domain: r.domain,
          mxRecords: r.mxRecords as any,
          providerResponse: r.rawResponse as any,
          source: "BULK",
          verifiedAt: new Date(r.verifiedAt),
        })),
        skipDuplicates: true,
      });
    }

    // Record credit audit ledger
    await prisma.verificationCreditLedger.create({
      data: {
        workspaceId: job.workspaceId,
        userId: job.userId,
        provider: "REOON",
        operation: "BULK_VERIFY",
        creditsUsed: results.length,
        providerReference: job.id,
      },
    });

    // Safely synchronize existing Contacts without touching consent or suppression
    const normalizedEmails = results.map((r) => r.normalizedEmail);
    const existingContacts = await prisma.contact.findMany({
      where: {
        workspaceId: job.workspaceId,
        normalizedEmail: { in: normalizedEmails },
      },
    });

    if (existingContacts.length > 0) {
      const resultMap = new Map(results.map((r) => [r.normalizedEmail, r]));
      for (const contact of existingContacts) {
        const match = resultMap.get(contact.normalizedEmail);
        if (match) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              verificationStatus: match.status,
              lastVerifiedAt: new Date(),
            },
          });
        }
      }
    }

    // Update job to COMPLETED
    return await prisma.verificationJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        totalRecords: results.length,
        processedRecords: results.length,
        progressPercentage: 100,
        validCount,
        invalidCount,
        riskyCount,
        unknownCount,
        creditsUsed: results.length,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves paginated results for a bulk verification job.
   */
  public async getJobResults(
    jobId: string,
    workspaceId: string,
    options: { page?: number; limit?: number; search?: string; status?: string }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      jobId,
    };

    if (
      options.status &&
      ["VALID", "INVALID", "RISKY", "UNKNOWN"].includes(options.status.toUpperCase())
    ) {
      where.status = options.status.toUpperCase();
    }

    if (options.search && options.search.trim()) {
      where.email = {
        contains: options.search.trim(),
        mode: "insensitive",
      };
    }

    const [items, total] = await Promise.all([
      prisma.verificationResult.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          status: true,
          providerStatus: true,
          providerSubstatus: true,
          reason: true,
          overallScore: true,
          isValidSyntax: true,
          isDisposable: true,
          isRoleBased: true,
          isCatchAll: true,
          isDeliverable: true,
          domain: true,
          verifiedAt: true,
        },
      }),
      prisma.verificationResult.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generates a downloadable CSV string for a verified job.
   */
  public async exportJobResultsCsv(
    jobId: string,
    workspaceId: string,
    filter?: "all" | "valid" | "invalid" | "risky" | "deliverable"
  ): Promise<{ filename: string; csv: string }> {
    const job = await prisma.verificationJob.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new VerificationServiceError("Job not found", 404, "JOB_NOT_FOUND");
    }

    const where: any = {
      jobId,
      workspaceId,
    };

    if (filter === "valid") {
      where.status = "VALID";
    } else if (filter === "invalid") {
      where.status = "INVALID";
    } else if (filter === "risky") {
      where.status = "RISKY";
    } else if (filter === "deliverable") {
      where.status = "VALID";
      where.isDeliverable = true;
    }

    const results = await prisma.verificationResult.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    const header = [
      "Email",
      "Status",
      "Provider Status",
      "Substatus",
      "Score",
      "Reason",
      "Deliverable",
      "Disposable",
      "Catch All",
      "Role Based",
      "Domain",
      "Verified At",
    ].join(",");

    const rows = results.map((r) => {
      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(r.email),
        escapeCsv(r.status),
        escapeCsv(r.providerStatus),
        escapeCsv(r.providerSubstatus || ""),
        escapeCsv(r.overallScore ?? ""),
        escapeCsv(r.reason || ""),
        escapeCsv(r.isDeliverable ? "Yes" : "No"),
        escapeCsv(r.isDisposable ? "Yes" : "No"),
        escapeCsv(r.isCatchAll ? "Yes" : "No"),
        escapeCsv(r.isRoleBased ? "Yes" : "No"),
        escapeCsv(r.domain || ""),
        escapeCsv(r.verifiedAt.toISOString()),
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const baseName = job.filename.replace(/\.[^/.]+$/, "");
    const exportFilename = `${baseName}_verified_${filter || "all"}.csv`;

    return { filename: exportFilename, csv };
  }

  /**
   * Cancels a job locally.
   * Note: As per provider specifications, Reoon does not support remote abort of submitted bulk tasks.
   */
  public async cancelJob(jobId: string, workspaceId: string) {
    const job = await prisma.verificationJob.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new VerificationServiceError("Job not found", 404, "JOB_NOT_FOUND");
    }

    if (job.status === "COMPLETED") {
      throw new VerificationServiceError(
        "Cannot cancel a completed verification job",
        400,
        "ALREADY_COMPLETED"
      );
    }

    if (job.status === "CANCELLED") {
      return job;
    }

    return await prisma.verificationJob.update({
      where: { id: job.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        errorMessage:
          "Job cancelled by user (Remote Reoon verification task continues independently on provider server).",
      },
    });
  }

  /**
   * Deletes a single verification result by ID for database cleanup.
   */
  public async deleteSingleVerification(id: string, workspaceId: string) {
    const existing = await prisma.verificationResult.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new VerificationServiceError("Verification record not found", 404, "NOT_FOUND");
    }

    await prisma.verificationResult.delete({
      where: { id: existing.id },
    });

    return { success: true, id, email: existing.email };
  }

  /**
   * Deletes a verification job and all its cascaded results for database cleanup.
   */
  public async deleteJob(jobId: string, workspaceId: string) {
    const job = await prisma.verificationJob.findFirst({
      where: { id: jobId, workspaceId },
    });

    if (!job) {
      throw new VerificationServiceError("Verification job not found", 404, "NOT_FOUND");
    }

    // Cascade delete any results associated with this job
    await prisma.verificationResult.deleteMany({
      where: { jobId: job.id, workspaceId },
    });

    await prisma.verificationJob.delete({
      where: { id: job.id },
    });

    return { success: true, id: job.id, filename: job.filename };
  }

  /**
   * Retrieves unified audit history across both single and bulk verifications.
   */
  public async getUnifiedHistory(
    workspaceId: string,
    options: {
      type?: "all" | "single" | "bulk";
      page?: number;
      limit?: number;
      search?: string;
    }
  ) {
    const type = options.type || "all";
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 15));
    const search = options.search?.trim();

    // Stats counts
    const [totalSingle, totalBulk] = await Promise.all([
      prisma.verificationResult.count({
        where: { workspaceId, source: "SINGLE" },
      }),
      prisma.verificationJob.count({
        where: { workspaceId },
      }),
    ]);

    let singleItems: any[] = [];
    let bulkItems: any[] = [];

    if (type === "all" || type === "single") {
      const whereSingle: any = { workspaceId, source: "SINGLE" };
      if (search) {
        whereSingle.email = { contains: search, mode: "insensitive" };
      }
      singleItems = await prisma.verificationResult.findMany({
        where: whereSingle,
        orderBy: { verifiedAt: "desc" },
        take: limit * page + limit,
        select: {
          id: true,
          email: true,
          status: true,
          verificationMode: true,
          overallScore: true,
          providerStatus: true,
          providerSubstatus: true,
          reason: true,
          isDeliverable: true,
          isDisposable: true,
          isCatchAll: true,
          isRoleBased: true,
          domain: true,
          verifiedAt: true,
          createdAt: true,
        },
      });
    }

    if (type === "all" || type === "bulk") {
      const whereBulk: any = { workspaceId };
      if (search) {
        whereBulk.filename = { contains: search, mode: "insensitive" };
      }
      bulkItems = await prisma.verificationJob.findMany({
        where: whereBulk,
        orderBy: { createdAt: "desc" },
        take: limit * page + limit,
        select: {
          id: true,
          filename: true,
          sourceType: true,
          status: true,
          totalRecords: true,
          processedRecords: true,
          validCount: true,
          invalidCount: true,
          riskyCount: true,
          unknownCount: true,
          creditsUsed: true,
          progressPercentage: true,
          createdAt: true,
          completedAt: true,
        },
      });
    }

    const singleEmails = singleItems.map((s) => s.email.toLowerCase().trim());
    const contacts = await (prisma.contact as any).findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: singleEmails },
        isArchived: false,
      },
      select: {
        id: true,
        normalizedEmail: true,
        name: true,
        firstName: true,
        lastName: true,
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

    const mappedSingle = singleItems.map((r) => {
      const norm = r.email.toLowerCase().trim();
      const linkedContact = contactMap.get(norm);

      return {
        id: r.id,
        kind: "SINGLE" as const,
        title: r.email,
        status: r.status,
        mode: r.verificationMode || "POWER",
        score: r.overallScore,
        createdAt: r.verifiedAt || r.createdAt,
        contactId: linkedContact?.id || null,
        contactName: linkedContact?.name || null,
        hasContact: !!linkedContact,
        summary: `Single verification • Quality Score: ${r.overallScore !== null ? `${r.overallScore}/100` : "N/A"} • ${r.providerStatus || r.status}`,
        details: {
          isDeliverable: r.isDeliverable,
          isDisposable: r.isDisposable,
          isCatchAll: r.isCatchAll,
          isRoleBased: r.isRoleBased,
          domain: r.domain,
          reason: r.reason,
        },
      };
    });

    const mappedBulk = bulkItems.map((j) => ({
      id: j.id,
      kind: "BULK" as const,
      title: j.filename,
      status: j.status,
      mode: "BULK_BATCH",
      score: null,
      createdAt: j.createdAt,
      summary: `Bulk list verification • ${j.totalRecords} emails (${j.validCount} valid, ${j.invalidCount} invalid, ${j.riskyCount} risky)`,
      details: {
        totalRecords: j.totalRecords,
        processedRecords: j.processedRecords,
        validCount: j.validCount,
        invalidCount: j.invalidCount,
        riskyCount: j.riskyCount,
        unknownCount: j.unknownCount,
        progressPercentage: j.progressPercentage,
        sourceType: j.sourceType,
      },
    }));

    const combined = [...mappedSingle, ...mappedBulk].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalCount =
      type === "single"
        ? (search ? singleItems.length : totalSingle)
        : type === "bulk"
        ? (search ? bulkItems.length : totalBulk)
        : (search ? combined.length : totalSingle + totalBulk);

    const skip = (page - 1) * limit;
    const paginatedItems = combined.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
      stats: {
        totalSingle,
        totalBulk,
        totalAll: totalSingle + totalBulk,
      },
    };
  }
}

export const verificationService = new VerificationService();
