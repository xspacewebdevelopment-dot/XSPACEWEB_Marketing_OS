import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Applying Campaign models DDL to Neon PostgreSQL...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(64) PRIMARY KEY,
      "workspaceId" VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "userId" VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'NEWSLETTER' NOT NULL,
      status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL,
      "fromName" VARCHAR(255) NOT NULL,
      "fromEmail" VARCHAR(255) NOT NULL,
      "replyTo" VARCHAR(255),
      subject VARCHAR(500) NOT NULL,
      preheader VARCHAR(500),
      "templateId" VARCHAR(64),
      "compiledHtml" TEXT,
      "editorJson" JSONB,
      "plainText" TEXT,
      "audienceConfig" JSONB,
      "utmParams" JSONB,
      "trackingSettings" JSONB,
      "postalAddress" TEXT,
      "batchSize" INTEGER DEFAULT 100 NOT NULL,
      "batchDelayMs" INTEGER DEFAULT 1000 NOT NULL,
      "scheduledAt" TIMESTAMPTZ,
      timezone VARCHAR(100) DEFAULT 'UTC',
      "startedAt" TIMESTAMPTZ,
      "completedAt" TIMESTAMPTZ,
      "cancelledAt" TIMESTAMPTZ,
      "pausedAt" TIMESTAMPTZ,
      "errorMessage" TEXT,
      "totalRecipients" INTEGER DEFAULT 0 NOT NULL,
      "submittedCount" INTEGER DEFAULT 0 NOT NULL,
      "deliveredCount" INTEGER DEFAULT 0 NOT NULL,
      "openedCount" INTEGER DEFAULT 0 NOT NULL,
      "clickedCount" INTEGER DEFAULT 0 NOT NULL,
      "bouncedCount" INTEGER DEFAULT 0 NOT NULL,
      "complainedCount" INTEGER DEFAULT 0 NOT NULL,
      "unsubscribedCount" INTEGER DEFAULT 0 NOT NULL,
      "failedCount" INTEGER DEFAULT 0 NOT NULL,
      "isArchived" BOOLEAN DEFAULT FALSE NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "campaigns_workspaceId_idx" ON campaigns("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "campaigns_workspaceId_status_idx" ON campaigns("workspaceId", status);`,
    `CREATE INDEX IF NOT EXISTS "campaigns_workspaceId_isArchived_idx" ON campaigns("workspaceId", "isArchived");`,
    `CREATE INDEX IF NOT EXISTS "campaigns_workspaceId_createdAt_idx" ON campaigns("workspaceId", "createdAt");`,

    `CREATE TABLE IF NOT EXISTS campaign_recipient_snapshots (
      id VARCHAR(64) PRIMARY KEY,
      "campaignId" VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      "contactId" VARCHAR(64) REFERENCES contacts(id) ON DELETE SET NULL,
      email VARCHAR(255) NOT NULL,
      "normalizedEmail" VARCHAR(255) NOT NULL,
      "firstName" VARCHAR(255),
      "lastName" VARCHAR(255),
      company VARCHAR(255),
      city VARCHAR(255),
      "customFields" JSONB,
      "unsubscribeToken" VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
      "exclusionReason" TEXT,
      "providerMessageId" VARCHAR(255),
      "errorMessage" TEXT,
      "submittedAt" TIMESTAMPTZ,
      "deliveredAt" TIMESTAMPTZ,
      "openedAt" TIMESTAMPTZ,
      "clickedAt" TIMESTAMPTZ,
      "bouncedAt" TIMESTAMPTZ,
      "unsubscribedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "snapshots_campaignId_idx" ON campaign_recipient_snapshots("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "snapshots_campaignId_status_idx" ON campaign_recipient_snapshots("campaignId", status);`,
    `CREATE INDEX IF NOT EXISTS "snapshots_normalizedEmail_idx" ON campaign_recipient_snapshots("normalizedEmail");`,
    `CREATE INDEX IF NOT EXISTS "snapshots_unsubscribeToken_idx" ON campaign_recipient_snapshots("unsubscribeToken");`,

    `CREATE TABLE IF NOT EXISTS campaign_sending_jobs (
      id VARCHAR(64) PRIMARY KEY,
      "campaignId" VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      "workspaceId" VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "idempotencyKey" VARCHAR(255) UNIQUE NOT NULL,
      "batchIndex" INTEGER DEFAULT 0 NOT NULL,
      "totalBatches" INTEGER DEFAULT 1 NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
      "processedCount" INTEGER DEFAULT 0 NOT NULL,
      "failedCount" INTEGER DEFAULT 0 NOT NULL,
      "errorMessage" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "completedAt" TIMESTAMPTZ
    );`,
    `CREATE INDEX IF NOT EXISTS "sending_jobs_campaignId_idx" ON campaign_sending_jobs("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "sending_jobs_workspaceId_idx" ON campaign_sending_jobs("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "sending_jobs_status_idx" ON campaign_sending_jobs(status);`,

    `CREATE TABLE IF NOT EXISTS email_sending_attempts (
      id VARCHAR(64) PRIMARY KEY,
      "campaignId" VARCHAR(64) NOT NULL,
      "snapshotId" VARCHAR(64) NOT NULL REFERENCES campaign_recipient_snapshots(id) ON DELETE CASCADE,
      "recipientEmail" VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      provider VARCHAR(50) DEFAULT 'RESEND' NOT NULL,
      "providerMessageId" VARCHAR(255),
      "responseCode" INTEGER,
      error TEXT,
      "attemptNumber" INTEGER DEFAULT 1 NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "attempts_campaignId_idx" ON email_sending_attempts("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "attempts_snapshotId_idx" ON email_sending_attempts("snapshotId");`,

    `CREATE TABLE IF NOT EXISTS email_events (
      id VARCHAR(64) PRIMARY KEY,
      "campaignId" VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      "recipientEmail" VARCHAR(255) NOT NULL,
      "eventType" VARCHAR(50) NOT NULL,
      provider VARCHAR(50) DEFAULT 'RESEND' NOT NULL,
      "providerMessageId" VARCHAR(255),
      metadata JSONB,
      "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "email_events_campaignId_idx" ON email_events("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "email_events_recipientEmail_idx" ON email_events("recipientEmail");`,
    `CREATE INDEX IF NOT EXISTS "email_events_eventType_idx" ON email_events("eventType");`,

    `CREATE TABLE IF NOT EXISTS campaign_metrics (
      id VARCHAR(64) PRIMARY KEY,
      "campaignId" VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      "recordedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      submitted INTEGER DEFAULT 0 NOT NULL,
      delivered INTEGER DEFAULT 0 NOT NULL,
      opens INTEGER DEFAULT 0 NOT NULL,
      clicks INTEGER DEFAULT 0 NOT NULL,
      bounces INTEGER DEFAULT 0 NOT NULL,
      unsubscribes INTEGER DEFAULT 0 NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "metrics_campaignId_idx" ON campaign_metrics("campaignId");`,
    `CREATE INDEX IF NOT EXISTS "metrics_campaignId_recordedAt_idx" ON campaign_metrics("campaignId", "recordedAt");`,
  ];

  for (const query of queries) {
    await prisma.$executeRawUnsafe(query);
  }

  console.log("Successfully created all campaign tables and indexes in Neon PostgreSQL!");
  const count = await prisma.campaign.count();
  console.log("Campaign table verification passed! Current campaign count:", count);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
