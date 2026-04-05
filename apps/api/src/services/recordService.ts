import { prisma } from "@repo/db";
import type { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from "@repo/validators";
import { AppError } from "../middleware/errorHandler";

// ─── Record Service ───────────────────────────────────────────────────────────

export const recordService = {
  // ── Create Record ────────────────────────────────────────────────────────────
  async createRecord(input: CreateRecordInput, createdById: string) {
    return prisma.financialRecord.create({
      data: {
        ...input,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  // ── List Records with Filtering & Pagination ─────────────────────────────────
  
  async listRecords(filters: RecordFilterInput) {
    const { type, category, startDate, endDate, page, limit } = filters;

    const where = {
      isDeleted: false,
      ...(type && { type }),
      ...(category && {
        category: { contains: category },
      }),
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    // Run count and data fetch in parallel — single round-trip cost
    const [total, records] = await Promise.all([
      prisma.financialRecord.count({ where }),
      prisma.financialRecord.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ── Get Single Record ────────────────────────────────────────────────────────
  async getRecordById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!record) throw new AppError("Record not found", 404);
    return record;
  },

  // ── Update Record ────────────────────────────────────────────────────────────
  async updateRecord(id: string, input: UpdateRecordInput) {
    // Verify exists and not deleted before update
    await recordService.getRecordById(id);

    return prisma.financialRecord.update({
      where: { id },
      data: input,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  // ── Soft Delete Record ───────────────────────────────────────────────────────
  // Financial records must never be hard deleted.
  // Soft delete preserves the data for audits while hiding it from normal queries.
  async deleteRecord(id: string) {
    await recordService.getRecordById(id);

    return prisma.financialRecord.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  },
};
