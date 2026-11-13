/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export interface VoiceTemplateData {
  id: string;
  workspaceId: string;
  userId: string | null;
  name: string;
  description: string | null;
  category: string;
  scriptText: string;
  language: string;
  voiceId: string;
  speed: number;
  tags: string[];
  isStarter: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface CreateVoiceTemplateInput {
  name: string;
  description?: string | null;
  category?: string;
  scriptText: string;
  language?: string;
  voiceId?: string;
  speed?: number;
  tags?: string[];
  isStarter?: boolean;
}

export interface UpdateVoiceTemplateInput {
  name?: string;
  description?: string | null;
  category?: string;
  scriptText?: string;
  language?: string;
  voiceId?: string;
  speed?: number;
  tags?: string[];
}

export interface ListVoiceTemplatesOptions {
  category?: string;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const STARTER_VOICE_TEMPLATES = [
  {
    name: "Automated Appointment Reminder",
    description: "Courteous reminder for upcoming consultations, service visits, or clinical appointments.",
    category: "REMINDER",
    language: "en-US",
    voiceId: "alloy",
    speed: 1.0,
    tags: ["appointment", "reminder", "healthcare", "service"],
    scriptText:
      "Hello {{firstName}}, this is an automated reminder from {{company}} regarding your upcoming appointment scheduled for {{appointmentTime}}. If you need to reschedule or have any questions, please contact our support team. Thank you and have a wonderful day!",
  },
  {
    name: "Order Delivery Dispatch Update",
    description: "Proactive shipping and delivery notification for e-commerce and retail customers.",
    category: "TRANSACTIONAL",
    language: "en-US",
    voiceId: "echo",
    speed: 1.0,
    tags: ["order", "delivery", "shipping", "ecommerce"],
    scriptText:
      "Hi {{firstName}}, your order with {{company}} is out for delivery today. Our courier driver will arrive at your destination in {{city}} shortly. Please ensure someone is available to receive the package. Thank you for shopping with us!",
  },
  {
    name: "Post-Interaction Customer Experience Survey",
    description: "Quick post-support or post-purchase satisfaction check to collect customer NPS.",
    category: "SURVEY",
    language: "en-US",
    voiceId: "fable",
    speed: 0.95,
    tags: ["feedback", "survey", "nps", "support"],
    scriptText:
      "Hello {{firstName}}, thank you for contacting {{company}} today. We strive to provide excellent service. On a scale of 1 to 5, how satisfied were you with your recent experience? We appreciate your feedback and thank you for being a valued customer.",
  },
  {
    name: "Scheduled System Maintenance Alert",
    description: "Urgent notification about planned infrastructure updates or downtime windows.",
    category: "NOTIFICATION",
    language: "en-US",
    voiceId: "onyx",
    speed: 1.0,
    tags: ["alert", "maintenance", "downtime", "devops"],
    scriptText:
      "Attention {{firstName}}, this is a service notification from {{company}}. Our systems will undergo scheduled maintenance tonight starting at 11 PM UTC for approximately 2 hours. Service interruptions may occur. Thank you for your patience.",
  },
  {
    name: "VIP Exclusive Upgrade Invitation",
    description: "Engaging invitation for high-tier loyalty members to unlock seasonal offers.",
    category: "MARKETING",
    language: "en-US",
    voiceId: "nova",
    speed: 1.0,
    tags: ["vip", "upgrade", "loyalty", "promotion"],
    scriptText:
      "Hello {{firstName}}, as a valued partner at {{company}}, you have been selected for exclusive early access to our new marketing automation tools. Visit your portal dashboard or speak with your account manager to activate your benefits today.",
  },
];

export class VoiceTemplatesService {
  /**
   * List voice templates strictly scoped to workspaceId
   */
  public async listTemplates(workspaceId: string, options: ListVoiceTemplatesOptions = {}) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (options.category && options.category !== "ALL") {
      where.category = options.category;
    }

    if (options.language && options.language !== "ALL") {
      where.language = options.language;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { scriptText: { contains: q, mode: "insensitive" } },
      ];
    }

    const [templates, total, allCount, reminderCount, notificationCount, transactionalCount, marketingCount, surveyCount] =
      await Promise.all([
        (prisma as any).voiceTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        (prisma as any).voiceTemplate.count({ where }),
        (prisma as any).voiceTemplate.count({ where: { workspaceId } }),
        (prisma as any).voiceTemplate.count({ where: { workspaceId, category: "REMINDER" } }),
        (prisma as any).voiceTemplate.count({ where: { workspaceId, category: "NOTIFICATION" } }),
        (prisma as any).voiceTemplate.count({ where: { workspaceId, category: "TRANSACTIONAL" } }),
        (prisma as any).voiceTemplate.count({ where: { workspaceId, category: "MARKETING" } }),
        (prisma as any).voiceTemplate.count({ where: { workspaceId, category: "SURVEY" } }),
      ]);

    return {
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: allCount,
        reminder: reminderCount,
        notification: notificationCount,
        transactional: transactionalCount,
        marketing: marketingCount,
        survey: surveyCount,
      },
    };
  }

  /**
   * Get single template by ID scoped to workspaceId
   */
  public async getTemplateById(id: string, workspaceId: string): Promise<VoiceTemplateData | null> {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    return (prisma as any).voiceTemplate.findFirst({
      where: { id, workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Create new voice template
   */
  public async createTemplate(
    workspaceId: string,
    userId: string | undefined,
    data: CreateVoiceTemplateInput
  ): Promise<VoiceTemplateData> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!data.name?.trim()) throw new Error("Template name is required");
    if (!data.scriptText?.trim()) throw new Error("Script content is required");

    return (prisma as any).voiceTemplate.create({
      data: {
        workspaceId,
        userId: userId || null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category?.toUpperCase() || "GENERAL",
        scriptText: data.scriptText.trim(),
        language: data.language?.trim() || "en-US",
        voiceId: data.voiceId?.trim() || "alloy",
        speed: data.speed !== undefined ? Number(data.speed) : 1.0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        isStarter: Boolean(data.isStarter),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Update existing voice template
   */
  public async updateTemplate(
    id: string,
    workspaceId: string,
    data: UpdateVoiceTemplateInput
  ): Promise<VoiceTemplateData> {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).voiceTemplate.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Template not found or access denied.");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.category !== undefined) updateData.category = data.category.toUpperCase();
    if (data.scriptText !== undefined) updateData.scriptText = data.scriptText.trim();
    if (data.language !== undefined) updateData.language = data.language.trim();
    if (data.voiceId !== undefined) updateData.voiceId = data.voiceId.trim();
    if (data.speed !== undefined) updateData.speed = Number(data.speed);
    if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : [];

    return (prisma as any).voiceTemplate.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Delete voice template
   */
  public async deleteTemplate(id: string, workspaceId: string) {
    if (!id || !workspaceId) throw new Error("ID and Workspace ID are required");

    const existing = await (prisma as any).voiceTemplate.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error("Template not found or access denied.");
    }

    await (prisma as any).voiceTemplate.delete({
      where: { id },
    });

    return { success: true, deletedId: id };
  }

  /**
   * Seed curated starter templates for the workspace (explicitly marked as examples)
   */
  public async seedStarterTemplates(workspaceId: string, userId?: string) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    let count = 0;
    for (const starter of STARTER_VOICE_TEMPLATES) {
      const existing = await (prisma as any).voiceTemplate.findFirst({
        where: { workspaceId, name: starter.name },
      });

      if (!existing) {
        await (prisma as any).voiceTemplate.create({
          data: {
            workspaceId,
            userId: userId || null,
            name: starter.name,
            description: starter.description,
            category: starter.category,
            scriptText: starter.scriptText,
            language: starter.language,
            voiceId: starter.voiceId,
            speed: starter.speed,
            tags: starter.tags,
            isStarter: true,
          },
        });
        count++;
      }
    }

    return { success: true, count };
  }
}

export const voiceTemplatesService = new VoiceTemplatesService();
