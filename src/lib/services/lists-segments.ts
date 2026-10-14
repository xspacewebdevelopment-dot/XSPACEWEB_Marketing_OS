import { prisma } from "@/lib/prisma";
import type {
  SegmentConditionGroup,
  SegmentSummary,
  ContactListSummary,
} from "@/lib/types/contacts";

export class ListsSegmentsService {
  // -------------------------------------------------------------
  // CONTACT LISTS
  // -------------------------------------------------------------

  public async getLists(workspaceId: string): Promise<ContactListSummary[]> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const lists = await prisma.contactList.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return lists.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,
      name: l.name,
      description: l.description,
      contactCount: l._count.memberships,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
  }

  public async getListById(workspaceId: string, listId: string) {
    if (!workspaceId || !listId) throw new Error("Workspace and List ID are required");

    const list = await prisma.contactList.findFirst({
      where: { id: listId, workspaceId },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!list) throw new Error("Contact list not found");

    return {
      id: list.id,
      workspaceId: list.workspaceId,
      name: list.name,
      description: list.description,
      contactCount: list._count.memberships,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    };
  }

  public async createList(
    workspaceId: string,
    data: { name: string; description?: string }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!data.name || !data.name.trim()) throw new Error("List name is required");

    const existing = await prisma.contactList.findFirst({
      where: { workspaceId, name: data.name.trim() },
    });

    if (existing) {
      throw new Error(`A contact list named "${data.name.trim()}" already exists in this workspace.`);
    }

    const created = await prisma.contactList.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    return {
      ...created,
      contactCount: 0,
    };
  }

  public async updateList(
    workspaceId: string,
    listId: string,
    data: { name?: string; description?: string }
  ) {
    if (!workspaceId || !listId) throw new Error("Workspace and List ID are required");

    const list = await prisma.contactList.findFirst({
      where: { id: listId, workspaceId },
    });
    if (!list) throw new Error("List not found");

    const updated = await prisma.contactList.update({
      where: { id: listId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() || null : undefined,
      },
      include: {
        _count: { select: { memberships: true } },
      },
    });

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      description: updated.description,
      contactCount: updated._count.memberships,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  public async deleteList(workspaceId: string, listId: string) {
    if (!workspaceId || !listId) throw new Error("Workspace and List ID are required");

    const list = await prisma.contactList.findFirst({
      where: { id: listId, workspaceId },
    });
    if (!list) throw new Error("List not found");

    await prisma.contactList.delete({
      where: { id: listId },
    });

    return { success: true, deletedId: listId };
  }

  public async addContactsToList(
    workspaceId: string,
    listId: string,
    contactIds: string[]
  ) {
    if (!workspaceId || !listId) throw new Error("Workspace and List ID are required");
    if (!Array.isArray(contactIds) || contactIds.length === 0) return { addedCount: 0 };

    const list = await prisma.contactList.findFirst({
      where: { id: listId, workspaceId },
    });
    if (!list) throw new Error("Contact list not found");

    // Filter contacts belonging to workspace
    const validContacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, workspaceId },
      select: { id: true },
    });

    let addedCount = 0;
    for (const c of validContacts) {
      await prisma.contactListMembership.upsert({
        where: {
          contactId_listId: { contactId: c.id, listId },
        },
        create: { contactId: c.id, listId },
        update: {},
      });
      addedCount++;
    }

    return { addedCount };
  }

  public async removeContactsFromList(
    workspaceId: string,
    listId: string,
    contactIds: string[]
  ) {
    if (!workspaceId || !listId) throw new Error("Workspace and List ID are required");
    if (!Array.isArray(contactIds) || contactIds.length === 0) return { removedCount: 0 };

    const res = await prisma.contactListMembership.deleteMany({
      where: {
        listId,
        contactId: { in: contactIds },
        contact: { workspaceId },
      },
    });

    return { removedCount: res.count };
  }

  // -------------------------------------------------------------
  // DYNAMIC SEGMENTS
  // -------------------------------------------------------------

  public async getSegments(workspaceId: string): Promise<SegmentSummary[]> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const segments = await prisma.segment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    const evaluated = await Promise.all(
      segments.map(async (s) => {
        const count = await this.evaluateSegmentCount(workspaceId, s.conditions as any);
        return {
          id: s.id,
          workspaceId: s.workspaceId,
          name: s.name,
          description: s.description,
          conditions: s.conditions as any,
          matchingCount: count,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        };
      })
    );

    return evaluated;
  }

  public async getSegmentById(workspaceId: string, segmentId: string) {
    if (!workspaceId || !segmentId) throw new Error("Workspace and Segment ID are required");

    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
    });
    if (!segment) throw new Error("Segment not found");

    const matchingCount = await this.evaluateSegmentCount(workspaceId, segment.conditions as any);

    return {
      id: segment.id,
      workspaceId: segment.workspaceId,
      name: segment.name,
      description: segment.description,
      conditions: segment.conditions as any,
      matchingCount,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
    };
  }

  public async createSegment(
    workspaceId: string,
    data: { name: string; description?: string; conditions: SegmentConditionGroup }
  ) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!data.name || !data.name.trim()) throw new Error("Segment name is required");

    const created = await prisma.segment.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        conditions: data.conditions as any,
      },
    });

    const matchingCount = await this.evaluateSegmentCount(workspaceId, data.conditions);

    return {
      id: created.id,
      workspaceId: created.workspaceId,
      name: created.name,
      description: created.description,
      conditions: created.conditions as any,
      matchingCount,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  public async updateSegment(
    workspaceId: string,
    segmentId: string,
    data: { name?: string; description?: string; conditions?: SegmentConditionGroup }
  ) {
    if (!workspaceId || !segmentId) throw new Error("Workspace and Segment ID are required");

    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
    });
    if (!segment) throw new Error("Segment not found");

    const updated = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() || null : undefined,
        conditions: data.conditions !== undefined ? (data.conditions as any) : undefined,
      },
    });

    const matchingCount = await this.evaluateSegmentCount(
      workspaceId,
      (data.conditions || segment.conditions) as any
    );

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      description: updated.description,
      conditions: updated.conditions as any,
      matchingCount,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  public async deleteSegment(workspaceId: string, segmentId: string) {
    if (!workspaceId || !segmentId) throw new Error("Workspace and Segment ID are required");

    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
    });
    if (!segment) throw new Error("Segment not found");

    await prisma.segment.delete({
      where: { id: segmentId },
    });

    return { success: true, deletedId: segmentId };
  }

  /**
   * Translates segment conditions into safe Prisma queries and executes count
   */
  public async evaluateSegmentCount(
    workspaceId: string,
    group: SegmentConditionGroup
  ): Promise<number> {
    const where = this.buildPrismaWhereFromGroup(workspaceId, group);
    return prisma.contact.count({ where });
  }

  /**
   * Preview matching contacts for a segment
   */
  public async previewSegmentMatches(
    workspaceId: string,
    group: SegmentConditionGroup,
    limit: number = 10
  ) {
    const where = this.buildPrismaWhereFromGroup(workspaceId, group);
    const [matchingCount, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lists: { include: { list: true } },
        },
      }),
    ]);

    return {
      matchingCount,
      sampleContacts: contacts.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        company: c.company,
        verificationStatus: c.verificationStatus,
        subscriptionStatus: c.subscriptionStatus,
      })),
    };
  }

  private buildPrismaWhereFromGroup(
    workspaceId: string,
    group: SegmentConditionGroup
  ): any {
    const baseWhere: any = { workspaceId, isArchived: false };
    if (!group || !Array.isArray(group.conditions) || group.conditions.length === 0) {
      return baseWhere;
    }

    const conditionClauses: any[] = [];

    for (const cond of group.conditions) {
      const clause = this.buildSingleConditionClause(cond);
      if (clause) conditionClauses.push(clause);
    }

    if (conditionClauses.length === 0) return baseWhere;

    if (group.matchType === "OR") {
      return {
        AND: [baseWhere, { OR: conditionClauses }],
      };
    } else {
      return {
        AND: [baseWhere, ...conditionClauses],
      };
    }
  }

  private buildSingleConditionClause(cond: any): any {
    const { field, operator, value } = cond;
    if (!field || !operator) return null;

    if (field === "verificationStatus") {
      if (operator === "equals") return { verificationStatus: value };
      if (operator === "not_equals") return { verificationStatus: { not: value } };
      if (operator === "in" && Array.isArray(value)) return { verificationStatus: { in: value } };
    }

    if (field === "subscriptionStatus") {
      if (operator === "equals") return { subscriptionStatus: value };
      if (operator === "not_equals") return { subscriptionStatus: { not: value } };
    }

    if (field === "listId") {
      if (operator === "equals") return { lists: { some: { listId: value } } };
      if (operator === "not_equals") return { lists: { none: { listId: value } } };
    }

    if (field === "tag") {
      if (operator === "equals" || operator === "contains") return { tags: { has: value } };
    }

    if (field === "email" || field === "name" || field === "company" || field === "phone") {
      if (operator === "equals") return { [field]: { equals: value, mode: "insensitive" } };
      if (operator === "not_equals") return { [field]: { not: { equals: value, mode: "insensitive" } } };
      if (operator === "contains") return { [field]: { contains: value, mode: "insensitive" } };
      if (operator === "not_contains") return { [field]: { not: { contains: value, mode: "insensitive" } } };
    }

    return null;
  }
}

export const listsSegmentsService = new ListsSegmentsService();
