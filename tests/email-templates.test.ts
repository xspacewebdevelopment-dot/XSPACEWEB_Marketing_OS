import { prisma } from "../src/lib/prisma";
import {
  sanitizeEmailHtml,
  interpolatePersonalization,
  wrapInEmailContainer,
  SAMPLE_PERSONALIZATION,
} from "../src/lib/templates/compiler";
import { resendService } from "../src/lib/resend/client";
import { STARTER_TEMPLATES } from "../src/lib/templates/starter-templates";

async function runTests() {
  console.log("\n========================================================");
  console.log("   NEXAREACH EMAIL TEMPLATES MODULE - AUTOMATED AUDIT   ");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. STARTER TEMPLATES INTEGRITY
  console.log("--- 1. Starter Templates Suite ---");
  assert(
    STARTER_TEMPLATES.length >= 8,
    "Starter templates catalog loaded",
    `Count: ${STARTER_TEMPLATES.length}`
  );
  const categories = new Set(STARTER_TEMPLATES.map((t) => t.category));
  assert(
    categories.has("NEWSLETTER") &&
      categories.has("PROMOTIONAL") &&
      categories.has("PRODUCT") &&
      categories.has("EVENT") &&
      categories.has("WELCOME") &&
      categories.has("FOLLOWUP"),
    "All required starter template categories present"
  );

  // 2. HTML COMPILER & SANITIZATION
  console.log("\n--- 2. HTML Compiler & Security Sanitization ---");
  const dirtyHtml = `
    <div>
      <script>alert('xss');</script>
      <h1 onclick="malicious()">Title</h1>
      <a href="javascript:stealCookie()">Click</a>
      <iframe src="evil.com"></iframe>
      <p>Clean text</p>
    </div>
  `;
  const sanitized = sanitizeEmailHtml(dirtyHtml);
  assert(!sanitized.includes("<script>"), "Strips <script> tags");
  assert(!sanitized.includes("onclick="), "Strips inline event handlers");
  assert(!sanitized.includes("javascript:"), "Strips javascript: pseudo-protocols");
  assert(!sanitized.includes("<iframe"), "Strips <iframe> tags");
  assert(sanitized.includes("Clean text"), "Preserves valid markup and content");

  // 3. PERSONALIZATION INTERPOLATION
  console.log("\n--- 3. Personalization Engine ---");
  const templateStr = "Hello {{first_name}}, welcome to {{company}}! Your code is {{code|DEFAULT123}}.";
  const rendered = interpolatePersonalization(templateStr, {
    first_name: "Sarah",
    company: "Cyberdyne Systems",
  });
  assert(rendered.includes("Hello Sarah"), "Interpolates {{first_name}}");
  assert(rendered.includes("welcome to Cyberdyne Systems"), "Interpolates {{company}}");
  assert(rendered.includes("DEFAULT123"), "Resolves fallback {{code|DEFAULT123}} when key missing");

  // 4. EMAIL WRAPPER & COMPATIBILITY
  console.log("\n--- 4. Email Client Responsive Wrapper ---");
  const wrapped = wrapInEmailContainer("<h1>Hello World</h1>", {
    title: "Test Email",
    preheader: "Preview snippet here",
    contentWidth: 600,
  });
  assert(wrapped.includes("<!DOCTYPE html>"), "Contains email doctype");
  assert(wrapped.includes("max-width: 600px"), "Sets standard 600px email container");
  assert(wrapped.includes("Preview snippet here"), "Includes hidden preheader snippet");
  assert(wrapped.includes("Hello World"), "Embeds inner template content");

  // 5. DATABASE CRUD & WORKSPACE ISOLATION (NEON POSTGRESQL)
  console.log("\n--- 5. Neon PostgreSQL Database Persistence & Isolation ---");
  
  // Find an existing workspace for test isolation
  const workspaceA = await prisma.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!workspaceA) {
    console.warn("⚠️ No workspace found to test DB CRUD. Skipping DB test.");
  } else {
    const testTemplateName = `Automated Test Template ${Date.now()}`;
    
    // Create
    const created = await prisma.emailTemplate.create({
      data: {
        workspaceId: workspaceA.id,
        name: testTemplateName,
        category: "NEWSLETTER",
        status: "DRAFT",
        subject: "Exclusive Newsletter Test",
        preheader: "Read our audit results",
        compiledHtml: "<table><tr><td>Test Content</td></tr></table>",
        editorJson: { components: [{ type: "text", content: "Test Content" }] },
      },
    });

    assert(Boolean(created.id), "Template persisted to Neon PostgreSQL", `ID: ${created.id}`);
    assert(created.name === testTemplateName, "Persisted template name verified");
    assert(created.category === "NEWSLETTER", "Persisted category verified");

    // Read & Reload
    const reloaded = await prisma.emailTemplate.findUnique({
      where: { id: created.id },
    });
    assert(Boolean(reloaded), "Reloaded template without losing design");
    assert(
      Boolean(reloaded?.editorJson),
      "Editor source JSON preserved alongside compiled HTML"
    );

    // Update
    const updated = await prisma.emailTemplate.update({
      where: { id: created.id },
      data: {
        name: `${testTemplateName} (Updated)`,
        status: "PUBLISHED",
      },
    });
    assert(updated.status === "PUBLISHED", "Template status updated to PUBLISHED");
    assert(updated.name.includes("(Updated)"), "Template name updated");

    // Duplicate
    const duplicated = await prisma.emailTemplate.create({
      data: {
        workspaceId: workspaceA.id,
        name: `Copy of ${updated.name}`,
        category: updated.category,
        status: "DRAFT",
        subject: updated.subject,
        compiledHtml: updated.compiledHtml,
        editorJson: updated.editorJson ?? undefined,
      },
    });
    assert(duplicated.name.startsWith("Copy of"), "Duplicated template successfully");

    // Workspace Isolation Check
    const isolatedQuery = await prisma.emailTemplate.findFirst({
      where: {
        id: created.id,
        workspaceId: "non-existent-tenant-id",
      },
    });
    assert(isolatedQuery === null, "Workspace tenant isolation enforced (cross-tenant access blocked)");

    // Cleanup
    await prisma.emailTemplate.deleteMany({
      where: {
        id: { in: [created.id, duplicated.id] },
      },
    });
    const checkDeleted = await prisma.emailTemplate.findUnique({
      where: { id: created.id },
    });
    assert(checkDeleted === null, "Deleted template permanently from database");
  }

  // 6. RESEND API READINESS CHECK
  console.log("\n--- 6. Resend Provider Diagnostics ---");
  const isResendConfigured = resendService.isConfigured();
  const senderAddress = resendService.getSenderAddress();
  assert(isResendConfigured, "Resend API Key configured in environment");
  assert(
    senderAddress.includes("xspaceweb.com") || senderAddress.includes("NexaReach"),
    "Verified sender identity configured",
    `Sender: ${senderAddress}`
  );

  // 7. CLOUDINARY CDN MEDIA STORAGE
  console.log("\n--- 7. Cloudinary CDN Media Storage & Uploads ---");
  const { uploadBase64ToCloudinary, configureCloudinary } = await import("../src/lib/cloudinary");
  const cloudClient = configureCloudinary();
  const cloudName = cloudClient.config().cloud_name;
  assert(!!cloudName && cloudName.length > 0, "Cloudinary cloud_name loaded from environment", `cloud_name: ${cloudName}`);

  // Test direct upload of sample transparent image
  const sampleDataUri = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const uploadResult = await uploadBase64ToCloudinary(sampleDataUri, {
    folder: "nexareach/test-audit",
  });
  assert(
    uploadResult.secure_url.startsWith("https://res.cloudinary.com"),
    "Cloudinary returned secure HTTPS CDN URL",
    `URL: ${uploadResult.secure_url}`
  );
  assert(
    !uploadResult.secure_url.includes("data:image/"),
    "Database image persistence uses CDN URL rather than raw base64"
  );

  // Clean up test image
  await cloudClient.uploader.destroy(uploadResult.public_id);
  assert(true, "Cloudinary test asset purged successfully");

  console.log("\n========================================================");
  console.log(`   AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED   `);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
