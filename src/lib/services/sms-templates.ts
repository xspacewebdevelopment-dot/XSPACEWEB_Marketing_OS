/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export type SmsTemplateCategory =
  | "TRANSACTIONAL"
  | "PROMOTIONAL"
  | "ALERTS"
  | "MARKETING"
  | "GENERAL";

export interface CreateSmsTemplateInput {
  name: string;
  description?: string | null;
  protocol?: "SMS" | "RCS";
  category?: SmsTemplateCategory;
  messageText: string;
  rcsCardTitle?: string | null;
  rcsMediaUrl?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
}

export interface UpdateSmsTemplateInput {
  name?: string;
  description?: string | null;
  protocol?: "SMS" | "RCS";
  category?: SmsTemplateCategory;
  messageText?: string;
  rcsCardTitle?: string | null;
  rcsMediaUrl?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
}

export interface ListSmsTemplatesOptions {
  protocol?: string; // "ALL" | "SMS" | "RCS"
  category?: string; // "ALL" | SmsTemplateCategory
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Curated starter templates available for explicit opt-in addition.
 * Note: These are internal workspace blueprints and are not pre-registered with carriers or DLT registries.
 */
export const STARTER_SMS_TEMPLATES: CreateSmsTemplateInput[] = [
  {
    name: "Account Verification Passcode",
    description: "Standard security code format for login or two-factor authentication verification.",
    protocol: "SMS",
    category: "TRANSACTIONAL",
    messageText: "Your NexaReach verification code is {{otpCode}}. Valid for 10 minutes. For security, never share this code.",
  },
  {
    name: "Appointment & Strategy Session Reminder",
    description: "Calendar notification prompt with confirm and reschedule reply instructions.",
    protocol: "SMS",
    category: "ALERTS",
    messageText: "Hi {{firstName}}, reminder for your strategy session tomorrow at {{time}}. Reply 1 to confirm, 2 to reschedule. Reply STOP to opt out.",
  },
  {
    name: "Order Delivery & Tracking Alert",
    description: "Post-purchase delivery status update with tracking link.",
    protocol: "SMS",
    category: "TRANSACTIONAL",
    messageText: "Great news {{firstName}}! Your order #{{orderId}} is out for delivery today. Track progress at {{trackingUrl}}.",
  },
  {
    name: "VIP Interactive Product Showcase",
    description: "Rich RCS business card featuring high-resolution hero banner and direct CTA link.",
    protocol: "RCS",
    category: "PROMOTIONAL",
    messageText: "Experience the next evolution of NexaReach Marketing OS with enhanced multi-channel messaging and smart audience targeting.",
    rcsCardTitle: "Exclusive VIP Early Access",
    rcsActionLabel: "Explore Features",
    rcsActionUrl: "https://nexareach.com/dashboard",
    rcsMediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Special Flash Sale Urgency Card",
    description: "Promotional card highlighting discount code with instant checkout CTA button.",
    protocol: "RCS",
    category: "MARKETING",
    messageText: "Weekend Special: Unlock 40% off your team plan with code {{promoCode}}. Valid through Sunday midnight.",
    rcsCardTitle: "40% Weekend Flash Sale",
    rcsActionLabel: "Claim Discount",
    rcsActionUrl: "https://nexareach.com/pricing",
    rcsMediaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
  },
];

export class SmsTemplateService {
  /**
   * List templates strictly scoped to workspaceId with server-side filters, search & pagination
   */
  public async listTemplates(
    workspaceId: string,
    options: ListSmsTemplatesOptions = {}
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 12));
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (options.protocol && options.protocol !== "ALL") {
      where.protocol = options.protocol;
    }

    if (options.category && options.category !== "ALL") {
      where.category = options.category;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { messageText: { contains: q, mode: "insensitive" } },
      ];
    }

    const [templates, total, allCount, smsCount, rcsCount] = await Promise.all([
      (prisma as any).smsTemplate.findMany({
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
      (prisma as any).smsTemplate.count({ where }),
      (prisma as any).smsTemplate.count({ where: { workspaceId } }),
      (prisma as any).smsTemplate.count({ where: { workspaceId, protocol: "SMS" } }),
      (prisma as any).smsTemplate.count({ where: { workspaceId, protocol: "RCS" } }),
    ]);

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: allCount,
        sms: smsCount,
        rcs: rcsCount,
      },
    };
  }

  /**
   * Retrieve a single template by ID scoped to workspaceId
   */
  public async getTemplateById(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const template = await (prisma as any).smsTemplate.findFirst({
      where: { id, workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return template;
  }

  /**
   * Create a new SMS or RCS template strictly scoped to workspaceId
   */
  public async createTemplate(
    workspaceId: string,
    userId: string | undefined,
    data: CreateSmsTemplateInput
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const template = await (prisma as any).smsTemplate.create({
      data: {
        workspaceId,
        userId: userId || null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        protocol: data.protocol || "SMS",
        category: data.category || "GENERAL",
        messageText: data.messageText.trim(),
        rcsCardTitle: data.protocol === "RCS" ? data.rcsCardTitle?.trim() || null : null,
        rcsMediaUrl: data.protocol === "RCS" ? data.rcsMediaUrl?.trim() || null : null,
        rcsActionLabel: data.protocol === "RCS" ? data.rcsActionLabel?.trim() || null : null,
        rcsActionUrl: data.protocol === "RCS" ? data.rcsActionUrl?.trim() || null : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return template;
  }

  /**
   * Update an existing template scoped to workspaceId
   */
  public async updateTemplate(
    id: string,
    workspaceId: string,
    data: UpdateSmsTemplateInput
  ) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).smsTemplate.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Template not found or access denied.");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.protocol !== undefined) updateData.protocol = data.protocol;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.messageText !== undefined) updateData.messageText = data.messageText.trim();
    if (data.rcsCardTitle !== undefined) updateData.rcsCardTitle = data.rcsCardTitle?.trim() || null;
    if (data.rcsMediaUrl !== undefined) updateData.rcsMediaUrl = data.rcsMediaUrl?.trim() || null;
    if (data.rcsActionLabel !== undefined) updateData.rcsActionLabel = data.rcsActionLabel?.trim() || null;
    if (data.rcsActionUrl !== undefined) updateData.rcsActionUrl = data.rcsActionUrl?.trim() || null;

    const updated = await (prisma as any).smsTemplate.update({
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
   * Delete a template strictly scoped to workspaceId
   */
  public async deleteTemplate(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).smsTemplate.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Template not found or access denied.");
    }

    await (prisma as any).smsTemplate.delete({
      where: { id },
    });

    return { success: true, deletedId: id };
  }

  /**
   * Explicit opt-in starter templates seeder.
   * Only seeds templates when the user explicitly triggers this action.
   */
  public async seedStarterTemplates(workspaceId: string, userId?: string) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const createdTemplates = [];
    for (const starter of STARTER_SMS_TEMPLATES) {
      const created = await (prisma as any).smsTemplate.create({
        data: {
          workspaceId,
          userId: userId || null,
          name: starter.name,
          description: starter.description || null,
          protocol: starter.protocol || "SMS",
          category: starter.category || "GENERAL",
          messageText: starter.messageText,
          rcsCardTitle: starter.rcsCardTitle || null,
          rcsMediaUrl: starter.rcsMediaUrl || null,
          rcsActionLabel: starter.rcsActionLabel || null,
          rcsActionUrl: starter.rcsActionUrl || null,
        },
      });
      createdTemplates.push(created);
    }

    return {
      success: true,
      count: createdTemplates.length,
      templates: createdTemplates,
    };
  }
}

export const smsTemplateService = new SmsTemplateService();
