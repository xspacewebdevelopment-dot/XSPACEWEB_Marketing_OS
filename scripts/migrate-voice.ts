import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Applying non-destructive Voice Campaign models DDL to Neon PostgreSQL...");

  const queries = [
    // 1. Add voice consent fields to contacts table if not existing
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "voiceConsent" VARCHAR(50) DEFAULT 'PENDING' NOT NULL;`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "voiceConsentSource" VARCHAR(100);`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "voiceConsentTimestamp" TIMESTAMPTZ;`,
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "voiceOptOutTimestamp" TIMESTAMPTZ;`,
    `CREATE INDEX IF NOT EXISTS "contacts_workspaceId_voiceConsent_idx" ON contacts("workspaceId", "voiceConsent");`,

    // 2. Create voice_campaigns table
    `CREATE TABLE IF NOT EXISTS voice_campaigns (
      id VARCHAR(64) PRIMARY KEY,
      "workspaceId" VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "userId" VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      purpose VARCHAR(50) DEFAULT 'NOTIFICATION' NOT NULL,
      status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL,
      "scriptText" TEXT NOT NULL,
      language VARCHAR(50) DEFAULT 'en-US' NOT NULL,
      "voiceId" VARCHAR(50) DEFAULT 'alloy' NOT NULL,
      speed DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
      pitch DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
      "audienceType" VARCHAR(50) DEFAULT 'ALL' NOT NULL,
      "listId" VARCHAR(64),
      "segmentId" VARCHAR(64),
      "testPhone" VARCHAR(50),
      "audienceConfig" JSONB,
      "totalRecipients" INTEGER DEFAULT 0 NOT NULL,
      "eligibleCount" INTEGER DEFAULT 0 NOT NULL,
      "excludedCount" INTEGER DEFAULT 0 NOT NULL,
      "completedCount" INTEGER DEFAULT 0 NOT NULL,
      "failedCount" INTEGER DEFAULT 0 NOT NULL,
      "busyCount" INTEGER DEFAULT 0 NOT NULL,
      "noAnswerCount" INTEGER DEFAULT 0 NOT NULL,
      "cancelledCount" INTEGER DEFAULT 0 NOT NULL,
      "scheduledAt" TIMESTAMPTZ,
      timezone VARCHAR(100) DEFAULT 'UTC',
      "startedAt" TIMESTAMPTZ,
      "completedAt" TIMESTAMPTZ,
      "cancelledAt" TIMESTAMPTZ,
      "errorMessage" TEXT,
      "templateId" VARCHAR(64),
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "voice_campaigns_workspaceId_idx" ON voice_campaigns("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "voice_campaigns_workspaceId_status_idx" ON voice_campaigns("workspaceId", status);`,
    `CREATE INDEX IF NOT EXISTS "voice_campaigns_workspaceId_createdAt_idx" ON voice_campaigns("workspaceId", "createdAt");`,

    // 3. Create voice_call_jobs table
    `CREATE TABLE IF NOT EXISTS voice_call_jobs (
      id VARCHAR(64) PRIMARY KEY,
      "campaignId" VARCHAR(64) NOT NULL REFERENCES voice_campaigns(id) ON DELETE CASCADE,
      "workspaceId" VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "contactId" VARCHAR(64) REFERENCES contacts(id) ON DELETE SET NULL,
      "destinationPhone" VARCHAR(50) NOT NULL,
      "destinationPhoneNorm" VARCHAR(50) NOT NULL,
      "countryCode" VARCHAR(10),
      "renderedScript" TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
      "attemptCount" INTEGER DEFAULT 0 NOT NULL,
      "maxAttempts" INTEGER DEFAULT 3 NOT NULL,
      "scheduledAt" TIMESTAMPTZ,
      "startedAt" TIMESTAMPTZ,
      "completedAt" TIMESTAMPTZ,
      "callDurationSeconds" INTEGER,
      "providerName" VARCHAR(50),
      "providerCallId" VARCHAR(120),
      "failureCode" VARCHAR(50),
      "failureReason" TEXT,
      "isSimulated" BOOLEAN DEFAULT TRUE NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT "voice_call_jobs_campaignId_destinationPhoneNorm_key" UNIQUE ("campaignId", "destinationPhoneNorm")
    );`,
    `CREATE INDEX IF NOT EXISTS "voice_call_jobs_workspaceId_idx" ON voice_call_jobs("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "voice_call_jobs_campaignId_idx" ON voice_call_jobs("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "voice_call_jobs_campaignId_status_idx" ON voice_call_jobs("campaignId", status);`,
    `CREATE INDEX IF NOT EXISTS "voice_call_jobs_workspaceId_destinationPhoneNorm_idx" ON voice_call_jobs("workspaceId", "destinationPhoneNorm");`,

    // 4. Create voice_call_events table
    `CREATE TABLE IF NOT EXISTS voice_call_events (
      id VARCHAR(64) PRIMARY KEY,
      "workspaceId" VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "campaignId" VARCHAR(64) NOT NULL REFERENCES voice_campaigns(id) ON DELETE CASCADE,
      "jobId" VARCHAR(64) REFERENCES voice_call_jobs(id) ON DELETE CASCADE,
      "eventType" VARCHAR(60) NOT NULL,
      "previousStatus" VARCHAR(50),
      "newStatus" VARCHAR(50) NOT NULL,
      notes TEXT,
      metadata JSONB,
      "isSimulated" BOOLEAN DEFAULT TRUE NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "voice_call_events_workspaceId_idx" ON voice_call_events("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "voice_call_events_campaignId_idx" ON voice_call_events("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "voice_call_events_jobId_idx" ON voice_call_events("jobId");`,
    `CREATE INDEX IF NOT EXISTS "voice_call_events_createdAt_idx" ON voice_call_events("createdAt");`,

    // 5. Create voice_templates table
    `CREATE TABLE IF NOT EXISTS voice_templates (
      id VARCHAR(64) PRIMARY KEY,
      "workspaceId" VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "userId" VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) DEFAULT 'GENERAL' NOT NULL,
      "scriptText" TEXT NOT NULL,
      language VARCHAR(50) DEFAULT 'en-US' NOT NULL,
      "voiceId" VARCHAR(50) DEFAULT 'alloy' NOT NULL,
      speed DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
      "isStarter" BOOLEAN DEFAULT FALSE NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "voice_templates_workspaceId_idx" ON voice_templates("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "voice_templates_workspaceId_category_idx" ON voice_templates("workspaceId", category);`,
    `CREATE INDEX IF NOT EXISTS "voice_templates_workspaceId_language_idx" ON voice_templates("workspaceId", language);`,

    // 6. Create voice_settings table
    `CREATE TABLE IF NOT EXISTS voice_settings (
      id VARCHAR(64) PRIMARY KEY,
      "workspaceId" VARCHAR(64) UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "defaultLanguage" VARCHAR(50) DEFAULT 'en-US' NOT NULL,
      "defaultVoice" VARCHAR(50) DEFAULT 'alloy' NOT NULL,
      "defaultSpeed" DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
      timezone VARCHAR(100) DEFAULT 'UTC' NOT NULL,
      "callingWindowStart" VARCHAR(10) DEFAULT '09:00' NOT NULL,
      "callingWindowEnd" VARCHAR(10) DEFAULT '20:00' NOT NULL,
      "callingDays" VARCHAR(20) DEFAULT 'MON_FRI' NOT NULL,
      "quietHoursEnabled" BOOLEAN DEFAULT TRUE NOT NULL,
      "maxRetryAttempts" INTEGER DEFAULT 3 NOT NULL,
      "retryIntervalMinutes" INTEGER DEFAULT 30 NOT NULL,
      "enforceConsent" BOOLEAN DEFAULT TRUE NOT NULL,
      "enforceSuppression" BOOLEAN DEFAULT TRUE NOT NULL,
      "requireOptInProof" BOOLEAN DEFAULT TRUE NOT NULL,
      "providerStatus" VARCHAR(50) DEFAULT 'NOT_CONNECTED' NOT NULL,
      "providerName" VARCHAR(50),
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "voice_settings_workspaceId_idx" ON voice_settings("workspaceId");`,
  ];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    try {
      await prisma.$executeRawUnsafe(q);
      console.log(`Executed query [${i + 1}/${queries.length}]`);
    } catch (err: any) {
      console.error(`Error on query [${i + 1}]:`, err.message);
      throw err;
    }
  }

  console.log("✅ All Voice Campaign tables, constraints, and indexes successfully applied.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
