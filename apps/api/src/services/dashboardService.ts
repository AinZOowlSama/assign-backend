import { prisma } from "@repo/db";
import type { DashboardQueryInput } from "@repo/validators";

// ─── Dashboard Service ────────────────────────────────────────────────────────


export const dashboardService = {
  // ── Summary ──────────────────────────────────────────────────────────────────

  async getSummary(filters: DashboardQueryInput) {
    const dateFilter = buildDateFilter(filters);

    const grouped = await prisma.financialRecord.groupBy({
      by: ["type"],
      where: { isDeleted: false, ...dateFilter },
      _sum: { amount: true },
      _count: { id: true },
    });

    const income = grouped.find((g:any) => g.type === "INCOME");
    const expense = grouped.find((g:any) => g.type === "EXPENSE");

    const totalIncome = income?._sum.amount ?? 0;
    const totalExpenses = expense?._sum.amount ?? 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalTransactions: (income?._count.id ?? 0) + (expense?._count.id ?? 0),
    };
  },

  // ── Category Breakdown ───────────────────────────────────────────────────────
  
  async getCategoryBreakdown(filters: DashboardQueryInput) {
    const dateFilter = buildDateFilter(filters);

    const grouped = await prisma.financialRecord.groupBy({
      by: ["category", "type"],
      where: { isDeleted: false, ...dateFilter },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    return grouped.map((g:any) => ({
      category: g.category,
      type: g.type,
      total: g._sum.amount ?? 0,
      count: g._count.id,
    }));
  },

  // ── Monthly Trend ────────────────────────────────────────────────────────────

  async getMonthlyTrend() {
   
    const rows = await prisma.$queryRaw<
      { month: string; type: string; total: number }[]
    >`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        type,
        SUM(amount)             AS total
      FROM financial_records
      WHERE is_deleted = false
        AND date >= date('now', '-12 months')
      GROUP BY month, type
      ORDER BY month ASC
    `;

   
    const monthMap = new Map<string, { income: number; expenses: number }>();

    for (const row of rows) {
      if (!monthMap.has(row.month)) {
        monthMap.set(row.month, { income: 0, expenses: 0 });
      }
      const entry = monthMap.get(row.month)!;
      if (row.type === "INCOME") entry.income = Number(row.total);
      else entry.expenses = Number(row.total);
    }

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      ...data,
      net: data.income - data.expenses,
    }));
  },

  
  async getRecentActivity(limit = 10) {
    return prisma.financialRecord.findMany({
      where: { isDeleted: false },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  // ── Full Dashboard ────────────────────────────────────────────────────────────
  
  async getDashboard(filters: DashboardQueryInput) {
    const [summary, categoryBreakdown, monthlyTrend, recentActivity] =
      await Promise.all([
        dashboardService.getSummary(filters),
        dashboardService.getCategoryBreakdown(filters),
        dashboardService.getMonthlyTrend(),
        dashboardService.getRecentActivity(10),
      ]);

    return { summary, categoryBreakdown, monthlyTrend, recentActivity };
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateFilter(filters: DashboardQueryInput) {
  const { startDate, endDate } = filters;
  if (!startDate && !endDate) return {};

  return {
    date: {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    },
  };
}
