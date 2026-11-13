import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import * as XLSX from "xlsx";
import type {
  ContactItem,
  ContactQueryOptions,
  ContactStats,
  ContactVerificationStatus,
  ContactSubscriptionStatus,
  ContactSmsConsentStatus,
  SmsConsentSource,
} from "@/lib/types/contacts";
import { verificationService } from "./verification";
import { parseAndNormalizePhoneNumber } from "@/lib/sms/phone";

export class ContactsService {
  /**
   * Sanitizes spreadsheet cells against formula injection
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
   * Builds where clause for Contacts query
   */
  private buildWhereClause(workspaceId: string, options: ContactQueryOptions = {}): any {
    const where: any = {
      workspaceId,
      isArchived: options.isArchived ?? false,
    };

    if (options.verificationStatus && options.verificationStatus !== "ALL") {
      where.verificationStatus = options.verificationStatus;
    }

    if (options.subscriptionStatus && options.subscriptionStatus !== "ALL") {
      where.subscriptionStatus = options.subscriptionStatus;
    }

    if (options.listId) {
      where.lists = {
        some: {
          listId: options.listId,
        },
      };
    }

    if (options.tag) {
      where.tags = {
        has: options.tag,
      };
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { normalizedEmail: { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Server-side paginated, sorted, filtered contacts with dynamic suppression annotations
   */
  public async getContacts(workspaceId: string, options: ContactQueryOptions = {}) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(5, options.limit || 25));
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(workspaceId, options);

    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";
    const orderBy = { [sortBy]: sortOrder };

    // Fetch contacts with lists
    const [rawContacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          lists: {
            include: {
              list: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    // Live Bidirectional Suppression Check across workspace
    const emails = rawContacts.map((c) => c.normalizedEmail);
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
        normalizedEmail: { in: emails },
      },
      select: {
        normalizedEmail: true,
        reason: true,
        source: true,
      },
    });

    const suppressionMap = new Map(
      activeSuppressions.map((s) => [s.normalizedEmail, s])
    );

    let contacts: ContactItem[] = rawContacts.map((c) => {
      const sup = suppressionMap.get(c.normalizedEmail);
      return {
        id: c.id,
        workspaceId: c.workspaceId,
        email: c.email,
        normalizedEmail: c.normalizedEmail,
        firstName: c.firstName,
        lastName: c.lastName,
        name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
        phone: c.phone,
        phoneNormalized: (c as any).phoneNormalized || null,
        phoneCountry: (c as any).phoneCountry || null,
        smsConsent: ((c as any).smsConsent || "PENDING") as ContactSmsConsentStatus,
        smsConsentSource: (c as any).smsConsentSource || null,
        smsConsentTimestamp: (c as any).smsConsentTimestamp ? (c as any).smsConsentTimestamp.toISOString() : null,
        smsOptOutTimestamp: (c as any).smsOptOutTimestamp ? (c as any).smsOptOutTimestamp.toISOString() : null,
        company: c.company,
        jobTitle: c.jobTitle,
        tags: c.tags,
        customFields: c.customFields as any,
        notes: c.notes,
        isArchived: c.isArchived,
        verificationStatus: c.verificationStatus as ContactVerificationStatus,
        lastVerifiedAt: c.lastVerifiedAt ? c.lastVerifiedAt.toISOString() : null,
        subscriptionStatus: c.subscriptionStatus as ContactSubscriptionStatus,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        isSuppressed: !!sup,
        suppressionReason: sup ? sup.reason : null,
        suppressionSource: sup ? sup.source : null,
        lists: c.lists.map((m) => ({
          id: m.list.id,
          name: m.list.name,
        })),
      };
    });

    // If caller filtered by suppression status, apply filter
    if (options.suppressionStatus === "SUPPRESSED") {
      contacts = contacts.filter((c) => c.isSuppressed);
    } else if (options.suppressionStatus === "UNSUPPRESSED") {
      contacts = contacts.filter((c) => !c.isSuppressed);
    }

    return {
      contacts,
      pagination: {
        page,
        limit,
        total: options.suppressionStatus && options.suppressionStatus !== "ALL" ? contacts.length : total,
        totalPages: Math.ceil((options.suppressionStatus && options.suppressionStatus !== "ALL" ? contacts.length : total) / limit) || 1,
      },
    };
  }

  /**
   * Get single contact profile with full verification and suppression history
   */
  public async getContactById(workspaceId: string, id: string) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!id) throw new Error("Contact ID is required");

    const contact = await prisma.contact.findFirst({
      where: { id, workspaceId },
      include: {
        lists: {
          include: {
            list: true,
          },
        },
        results: {
          orderBy: { verifiedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!contact) {
      throw new Error("Contact not found in this workspace");
    }

    // Bidirectional Suppression lookup
    const suppression = await prisma.suppressionEntry.findFirst({
      where: {
        workspaceId,
        normalizedEmail: contact.normalizedEmail,
        status: "ACTIVE",
      },
    });

    // Full suppression audit history
    const suppressionAudits = await prisma.suppressionAuditLog.findMany({
      where: {
        workspaceId,
        normalizedEmail: contact.normalizedEmail,
      },
      orderBy: { createdAt: "desc" },
    });

    // Consent audit history
    const consentAudits = await prisma.contactConsentAuditLog.findMany({
      where: {
        workspaceId,
        contactId: contact.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      id: contact.id,
      workspaceId: contact.workspaceId,
      email: contact.email,
      normalizedEmail: contact.normalizedEmail,
      firstName: contact.firstName,
      lastName: contact.lastName,
      name: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null,
      phone: contact.phone,
      phoneNormalized: (contact as any).phoneNormalized || null,
      phoneCountry: (contact as any).phoneCountry || null,
      smsConsent: ((contact as any).smsConsent || "PENDING") as ContactSmsConsentStatus,
      smsConsentSource: (contact as any).smsConsentSource || null,
      smsConsentTimestamp: (contact as any).smsConsentTimestamp ? (contact as any).smsConsentTimestamp.toISOString() : null,
      smsOptOutTimestamp: (contact as any).smsOptOutTimestamp ? (contact as any).smsOptOutTimestamp.toISOString() : null,
      company: contact.company,
      jobTitle: contact.jobTitle,
      tags: contact.tags,
      customFields: contact.customFields as any,
      notes: contact.notes,
      isArchived: contact.isArchived,
      verificationStatus: contact.verificationStatus as ContactVerificationStatus,
      lastVerifiedAt: contact.lastVerifiedAt ? contact.lastVerifiedAt.toISOString() : null,
      subscriptionStatus: contact.subscriptionStatus as ContactSubscriptionStatus,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      isSuppressed: !!suppression,
      suppressionReason: suppression?.reason || null,
      suppressionSource: suppression?.source || null,
      suppressionId: suppression?.id || null,
      suppressionAudits,
      consentAudits,
      lists: contact.lists.map((m) => ({
        id: m.list.id,
        name: m.list.name,
      })),
      verificationHistory: contact.results.map((r) => ({
        id: r.id,
        status: r.status,
        providerStatus: r.providerStatus,
        overallScore: r.overallScore,
        source: r.source,
        verifiedAt: r.verifiedAt.toISOString(),
      })),
    };
  }

  /**
   * Fast lookup by email for integrations (Single Verify, Bulk Verify, Results)
   */
  public async lookupContactByEmail(workspaceId: string, email: string) {
    if (!workspaceId || !email) return null;
    const norm = normalizeEmail(email);
    const contact = await prisma.contact.findFirst({
      where: { workspaceId, normalizedEmail: norm },
      select: {
        id: true,
        email: true,
        name: true,
        verificationStatus: true,
        lastVerifiedAt: true,
        subscriptionStatus: true,
      },
    });
    return contact;
  }

  /**
   * Create single contact
   */
  public async createContact(
    workspaceId: string,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string;
      smsConsent?: ContactSmsConsentStatus;
      smsConsentSource?: string;
      performedByUserId?: string;
      performedByUserEmail?: string;
      company?: string;
      jobTitle?: string;
      tags?: string[];
      customFields?: Record<string, any>;
      notes?: string;
      verificationStatus?: ContactVerificationStatus;
      lastVerifiedAt?: Date | null;
      subscriptionStatus?: ContactSubscriptionStatus;
      listIds?: string[];
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!data.email || !data.email.includes("@")) {
      throw new Error("A valid email address is required");
    }

    const norm = normalizeEmail(data.email);

    // Check existing contact
    const existing = await prisma.contact.findUnique({
      where: {
        workspaceId_normalizedEmail: {
          workspaceId,
          normalizedEmail: norm,
        },
      },
    });

    if (existing) {
      throw new Error(`Contact with email "${norm}" already exists in this workspace.`);
    }

    const derivedName =
      data.name?.trim() ||
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
      null;

    const rawPhone = data.phone?.trim() || null;
    const phoneNorm = rawPhone ? parseAndNormalizePhoneNumber(rawPhone) : null;
    const smsConsent: ContactSmsConsentStatus = data.smsConsent || "PENDING";
    const smsConsentSource = data.smsConsent ? (data.smsConsentSource || "MANUAL") : null;
    const now = new Date();
    const smsConsentTimestamp = data.smsConsent ? now : null;
    const smsOptOutTimestamp = data.smsConsent === "OPTED_OUT" ? now : null;

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        email: data.email.trim(),
        normalizedEmail: norm,
        firstName: data.firstName?.trim() || null,
        lastName: data.lastName?.trim() || null,
        name: derivedName,
        phone: rawPhone,
        phoneNormalized: phoneNorm?.isValid ? phoneNorm.e164 : null,
        phoneCountry: phoneNorm?.isValid ? phoneNorm.country : null,
        smsConsent,
        smsConsentSource,
        smsConsentTimestamp,
        smsOptOutTimestamp,
        company: data.company?.trim() || null,
        jobTitle: data.jobTitle?.trim() || null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        customFields: data.customFields || {},
        notes: data.notes?.trim() || null,
        verificationStatus: data.verificationStatus || "UNVERIFIED",
        lastVerifiedAt: data.lastVerifiedAt || null,
        // STRICT RULE: Never assume consent. Default to PENDING unless explicitly provided.
        subscriptionStatus: data.subscriptionStatus || "PENDING",
        lists: data.listIds && data.listIds.length > 0
          ? {
              create: data.listIds.map((listId) => ({
                list: { connect: { id: listId } },
              })),
            }
          : undefined,
      },
      include: {
        lists: {
          include: { list: true },
        },
      },
    });

    // Record audit log if consent was explicitly provided upon creation
    if (data.smsConsent) {
      await prisma.contactConsentAuditLog.create({
        data: {
          workspaceId,
          contactId: contact.id,
          channel: "SMS",
          previousStatus: null,
          newStatus: smsConsent,
          source: smsConsentSource || "MANUAL",
          performedByUserId: data.performedByUserId || null,
          performedByUserEmail: data.performedByUserEmail || null,
          notes: "Initial SMS consent recorded at contact creation",
        },
      });
    }

    // Check if suppression already exists for this email
    const suppression = await prisma.suppressionEntry.findFirst({
      where: { workspaceId, normalizedEmail: norm, status: "ACTIVE" },
    });

    return {
      ...contact,
      isSuppressed: !!suppression,
      suppressionReason: suppression?.reason || null,
    };
  }

  /**
   * Update existing contact
   */
  public async updateContact(
    workspaceId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string;
      smsConsent?: ContactSmsConsentStatus;
      smsConsentSource?: string;
      performedByUserId?: string;
      performedByUserEmail?: string;
      consentNotes?: string;
      company?: string;
      jobTitle?: string;
      tags?: string[];
      customFields?: Record<string, any>;
      notes?: string;
      subscriptionStatus?: ContactSubscriptionStatus;
      isArchived?: boolean;
      listIds?: string[];
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!id) throw new Error("Contact ID is required");

    const existing = await prisma.contact.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Contact not found in this workspace");
    }

    const derivedName =
      data.name !== undefined
        ? data.name.trim() || null
        : data.firstName !== undefined || data.lastName !== undefined
        ? [data.firstName ?? existing.firstName, data.lastName ?? existing.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || null
        : existing.name;

    // Handle list associations if specified
    if (data.listIds !== undefined) {
      await prisma.contactListMembership.deleteMany({
        where: { contactId: id },
      });
      if (data.listIds.length > 0) {
        await prisma.contactListMembership.createMany({
          data: data.listIds.map((listId) => ({
            contactId: id,
            listId,
          })),
        });
      }
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName?.trim() || null;
    if (data.lastName !== undefined) updateData.lastName = data.lastName?.trim() || null;
    if (derivedName !== undefined) updateData.name = derivedName;
    if (data.company !== undefined) updateData.company = data.company?.trim() || null;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle?.trim() || null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.customFields !== undefined) updateData.customFields = data.customFields;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    // Normalize phone number if phone field changed
    if (data.phone !== undefined) {
      const rawPhone = data.phone?.trim() || null;
      const phoneNorm = rawPhone ? parseAndNormalizePhoneNumber(rawPhone) : null;
      updateData.phone = rawPhone;
      updateData.phoneNormalized = phoneNorm?.isValid ? phoneNorm.e164 : null;
      updateData.phoneCountry = phoneNorm?.isValid ? phoneNorm.country : null;
    }

    // Consent update & audit trail
    if (data.smsConsent !== undefined && data.smsConsent !== (existing as any).smsConsent) {
      const prevStatus = (existing as any).smsConsent || "PENDING";
      const newStatus = data.smsConsent;
      const now = new Date();

      updateData.smsConsent = newStatus;
      updateData.smsConsentSource = data.smsConsentSource || "MANUAL";
      updateData.smsConsentTimestamp = now;
      if (newStatus === "OPTED_OUT") {
        updateData.smsOptOutTimestamp = now;
      }

      await prisma.contactConsentAuditLog.create({
        data: {
          workspaceId,
          contactId: id,
          channel: "SMS",
          previousStatus: prevStatus,
          newStatus,
          source: data.smsConsentSource || "MANUAL",
          performedByUserId: data.performedByUserId || null,
          performedByUserEmail: data.performedByUserEmail || null,
          notes: data.consentNotes || `SMS consent changed from ${prevStatus} to ${newStatus}`,
        },
      });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        lists: {
          include: { list: true },
        },
      },
    });

    return updated;
  }

  /**
   * Dedicated SMS Consent update method with mandatory audit logging
   */
  public async updateContactSmsConsent(
    workspaceId: string,
    contactId: string,
    payload: {
      consent: ContactSmsConsentStatus;
      source?: SmsConsentSource | string;
      performedByUserId?: string;
      performedByUserEmail?: string;
      notes?: string;
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!contactId) throw new Error("Contact ID is required");
    if (!["PENDING", "OPTED_IN", "OPTED_OUT"].includes(payload.consent)) {
      throw new Error("Invalid SMS consent status. Must be PENDING, OPTED_IN, or OPTED_OUT.");
    }

    const existing = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });

    if (!existing) {
      throw new Error("Contact not found in this workspace");
    }

    const previousStatus = (existing as any).smsConsent || "PENDING";
    const newStatus = payload.consent;
    const now = new Date();

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        smsConsent: newStatus,
        smsConsentSource: payload.source || "MANUAL",
        smsConsentTimestamp: now,
        smsOptOutTimestamp: newStatus === "OPTED_OUT" ? now : (existing as any).smsOptOutTimestamp,
      },
    });

    // Write immutable audit log
    await prisma.contactConsentAuditLog.create({
      data: {
        workspaceId,
        contactId,
        channel: "SMS",
        previousStatus,
        newStatus,
        source: payload.source || "MANUAL",
        performedByUserId: payload.performedByUserId || null,
        performedByUserEmail: payload.performedByUserEmail || null,
        notes: payload.notes || `Consent changed from ${previousStatus} to ${newStatus}`,
      },
    });

    return updated;
  }

  /**
   * Retrieves full consent audit log history for a contact
   */
  public async getContactConsentAudits(workspaceId: string, contactId: string) {
    if (!workspaceId || !contactId) return [];
    return prisma.contactConsentAuditLog.findMany({
      where: { workspaceId, contactId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Delete contact.
   * STRICT ARCHITECTURE: Deleting a contact NEVER removes its active suppression!
   */
  public async deleteContact(workspaceId: string, id: string) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!id) throw new Error("Contact ID is required");

    const existing = await prisma.contact.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Contact not found in this workspace");
    }

    await prisma.contact.delete({
      where: { id },
    });

    return { success: true, deletedId: id };
  }

  /**
   * Real database aggregations for Contacts KPIs
   */
  public async getContactStats(workspaceId: string): Promise<ContactStats> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const [
      totalContacts,
      validCount,
      invalidCount,
      riskyCount,
      unverifiedCount,
      subscribedCount,
      suppressedCount,
    ] = await Promise.all([
      prisma.contact.count({ where: { workspaceId, isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, isArchived: false, verificationStatus: "VALID" } }),
      prisma.contact.count({ where: { workspaceId, isArchived: false, verificationStatus: "INVALID" } }),
      prisma.contact.count({ where: { workspaceId, isArchived: false, verificationStatus: "RISKY" } }),
      prisma.contact.count({ where: { workspaceId, isArchived: false, verificationStatus: "UNVERIFIED" } }),
      prisma.contact.count({ where: { workspaceId, isArchived: false, subscriptionStatus: "SUBSCRIBED" } }),
      prisma.suppressionEntry.count({ where: { workspaceId, status: "ACTIVE" } }),
    ]);

    return {
      totalContacts,
      validCount,
      invalidCount,
      riskyCount,
      unverifiedCount,
      subscribedCount,
      suppressedCount,
    };
  }

  /**
   * Bulk import contacts from CSV/XLSX/TXT data
   */
  public async bulkImportContacts(
    workspaceId: string,
    payload: {
      contacts: Array<{
        email: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        company?: string;
        jobTitle?: string;
        tags?: string[];
        verificationStatus?: ContactVerificationStatus;
        subscriptionStatus?: ContactSubscriptionStatus;
      }>;
      listIds?: string[];
    }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const { contacts, listIds = [] } = payload;

    const totalSubmitted = contacts.length;
    let invalidCount = 0;
    const validMap = new Map<string, any>();

    for (const c of contacts) {
      if (!c.email || !c.email.includes("@")) {
        invalidCount++;
        continue;
      }
      const norm = normalizeEmail(c.email);
      if (!validMap.has(norm)) {
        validMap.set(norm, {
          email: c.email.trim(),
          normalizedEmail: norm,
          firstName: c.firstName?.trim() || null,
          lastName: c.lastName?.trim() || null,
          name: c.name?.trim() || [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || null,
          phone: c.phone?.trim() || null,
          company: c.company?.trim() || null,
          jobTitle: c.jobTitle?.trim() || null,
          tags: Array.isArray(c.tags) ? c.tags : [],
          verificationStatus: c.verificationStatus || "UNVERIFIED",
          // Keep PENDING unless explicitly opted in
          subscriptionStatus: c.subscriptionStatus || "PENDING",
        });
      }
    }

    const uniqueValid = Array.from(validMap.values());
    const duplicatesWithinBatch = totalSubmitted - invalidCount - uniqueValid.length;

    // Check existing contacts in workspace
    const existing = await prisma.contact.findMany({
      where: {
        workspaceId,
        normalizedEmail: { in: uniqueValid.map((u) => u.normalizedEmail) },
      },
    });

    const existingMap = new Map(existing.map((e) => [e.normalizedEmail, e]));

    let importedCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of uniqueValid) {
        if (existingMap.has(item.normalizedEmail)) {
          // Update non-destructive fields
          const existingContact = existingMap.get(item.normalizedEmail)!;
          await tx.contact.update({
            where: { id: existingContact.id },
            data: {
              name: item.name || existingContact.name,
              phone: item.phone || existingContact.phone,
              company: item.company || existingContact.company,
              jobTitle: item.jobTitle || existingContact.jobTitle,
              tags: Array.from(new Set([...existingContact.tags, ...item.tags])),
            },
          });
          // Attach list memberships if specified
          for (const listId of listIds) {
            await tx.contactListMembership.upsert({
              where: {
                contactId_listId: { contactId: existingContact.id, listId },
              },
              create: { contactId: existingContact.id, listId },
              update: {},
            });
          }
          updatedCount++;
        } else {
          // Create new contact
          const created = await tx.contact.create({
            data: {
              workspaceId,
              email: item.email,
              normalizedEmail: item.normalizedEmail,
              firstName: item.firstName,
              lastName: item.lastName,
              name: item.name,
              phone: item.phone,
              company: item.company,
              jobTitle: item.jobTitle,
              tags: item.tags,
              verificationStatus: item.verificationStatus,
              subscriptionStatus: item.subscriptionStatus,
            },
          });
          for (const listId of listIds) {
            await tx.contactListMembership.create({
              data: { contactId: created.id, listId },
            });
          }
          importedCount++;
        }
      }
    });

    return {
      totalSubmitted,
      uniqueCount: uniqueValid.length,
      importedCount,
      updatedCount,
      skippedCount: duplicatesWithinBatch,
      invalidCount,
    };
  }

  /**
   * Export contacts to CSV or XLSX
   */
  public async exportContacts(
    workspaceId: string,
    options: ContactQueryOptions = {},
    format: "csv" | "xlsx" = "csv"
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const where = this.buildWhereClause(workspaceId, options);
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        lists: {
          include: { list: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check active suppressions
    const emails = contacts.map((c) => c.normalizedEmail);
    const activeSuppressions = await prisma.suppressionEntry.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
        normalizedEmail: { in: emails },
      },
    });
    const supMap = new Map(activeSuppressions.map((s) => [s.normalizedEmail, s]));

    const rows = contacts.map((c) => {
      const sup = supMap.get(c.normalizedEmail);
      return {
        Email: this.sanitizeSpreadsheetCell(c.email),
        Name: this.sanitizeSpreadsheetCell(c.name || ""),
        Phone: this.sanitizeSpreadsheetCell(c.phone || ""),
        Company: this.sanitizeSpreadsheetCell(c.company || ""),
        JobTitle: this.sanitizeSpreadsheetCell(c.jobTitle || ""),
        VerificationStatus: this.sanitizeSpreadsheetCell(c.verificationStatus),
        LastVerifiedAt: c.lastVerifiedAt ? c.lastVerifiedAt.toISOString() : "",
        SubscriptionStatus: this.sanitizeSpreadsheetCell(c.subscriptionStatus),
        IsSuppressed: sup ? "YES" : "NO",
        SuppressionReason: sup ? this.sanitizeSpreadsheetCell(sup.reason) : "",
        Lists: this.sanitizeSpreadsheetCell(c.lists.map((l) => l.list.name).join("; ")),
        Tags: this.sanitizeSpreadsheetCell(c.tags.join("; ")),
        CreatedAt: c.createdAt.toISOString(),
      };
    });

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return {
        data: buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        rowCount: contacts.length,
        filename: `contacts_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      };
    }

    const headers = Object.keys(rows[0] || {
      Email: "",
      Name: "",
      Phone: "",
      Company: "",
      JobTitle: "",
      VerificationStatus: "",
      LastVerifiedAt: "",
      SubscriptionStatus: "",
      IsSuppressed: "",
      SuppressionReason: "",
      Lists: "",
      Tags: "",
      CreatedAt: "",
    });

    const csvLines = [headers.map((h) => this.escapeCsvField(h)).join(",")];
    for (const r of rows) {
      csvLines.push(headers.map((h) => this.escapeCsvField((r as any)[h] || "")).join(","));
    }

    return {
      data: "\uFEFF" + csvLines.join("\r\n"),
      contentType: "text/csv; charset=utf-8",
      rowCount: contacts.length,
      filename: `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  /**
   * Re-verify contact using genuine Reoon verification pipeline
   */
  public async reverifyContact(workspaceId: string, contactId: string, userId: string) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });
    if (!contact) throw new Error("Contact not found");

    // Invoke verification engine
    const result = await verificationService.verifySingle({
      email: contact.email,
      workspaceId,
      userId,
      mode: "POWER",
    });

    // Update contact verification status
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        verificationStatus: result.status,
        lastVerifiedAt: new Date(),
      },
    });

    return result;
  }
}

export const contactsService = new ContactsService();
