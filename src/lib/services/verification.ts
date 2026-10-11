import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { reoonClient, ReoonProviderError } from "@/lib/reoon/client";
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
}

export const verificationService = new VerificationService();
