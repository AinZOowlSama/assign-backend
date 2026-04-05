import { Hono } from "hono";
import { dashboardService } from "../services/dashboardService";
import { authMiddleware } from "../middleware/auth";
import { rbac, Roles } from "../middleware/rbac";
import { validateQuery } from "../middleware/validate";
import { DashboardQuerySchema } from "@repo/validators";
import type { DashboardQueryInput } from "@repo/validators";

// ─── Dashboard Routes ─────────────────────────────────────────────────────────


export const dashboardRoutes = new Hono();

dashboardRoutes.use("*", authMiddleware);

// GET /api/dashboard — full dashboard in one request

dashboardRoutes.get(
  "/",
  rbac(Roles.ALL),
  validateQuery(DashboardQuerySchema),
  async (c) => {
    const filters = c.get("validatedQuery") as DashboardQueryInput;
    const data = await dashboardService.getDashboard(filters);

    return c.json({ success: true, data });
  }
);

// GET /api/dashboard/summary — totals only
dashboardRoutes.get(
  "/summary",
  rbac(Roles.ALL),
  validateQuery(DashboardQuerySchema),
  async (c) => {
    const filters = c.get("validatedQuery") as DashboardQueryInput;
    const data = await dashboardService.getSummary(filters);

    return c.json({ success: true, data });
  }
);

// GET /api/dashboard/categories — category breakdown
dashboardRoutes.get(
  "/categories",
  rbac(Roles.ALL),
  validateQuery(DashboardQuerySchema),
  async (c) => {
    const filters = c.get("validatedQuery") as DashboardQueryInput;
    const data = await dashboardService.getCategoryBreakdown(filters);

    return c.json({ success: true, data });
  }
);

// GET /api/dashboard/trend — monthly trend (last 12 months)
dashboardRoutes.get("/trend", rbac(Roles.ALL), async (c) => {
  const data = await dashboardService.getMonthlyTrend();

  return c.json({ success: true, data });
});

// GET /api/dashboard/recent — recent activity feed
dashboardRoutes.get("/recent", rbac(Roles.ALL), async (c) => {
  const limit = Number(c.req.query("limit") ?? 10);
  const data = await dashboardService.getRecentActivity(
    Math.min(limit, 50) // cap at 50 items
  );

  return c.json({ success: true, data });
});
