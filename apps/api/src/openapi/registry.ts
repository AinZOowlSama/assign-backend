import { z } from "zod";
import { createRoute } from "@hono/zod-openapi";


export const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export const successResponse = (dataSchema: z.ZodType) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

// ─── Auth routes ──────────────────────────────────────────────────────────────

export const registerRoute = createRoute({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(2),
            role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              token: z.string(),
              user: z.object({
                id: z.string(),
                email: z.string(),
                name: z.string(),
                role: z.string(),
              }),
            })
          ),
        },
      },
    },
    400: { description: "Validation error", content: { "application/json": { schema: ErrorSchema } } },
    409: { description: "Email already exists", content: { "application/json": { schema: ErrorSchema } } },
  },
});

export const loginRoute = createRoute({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Login and get JWT token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful — copy the token and click Authorize above",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              token: z.string(),
              user: z.object({
                id: z.string(),
                email: z.string(),
                role: z.string(),
              }),
            })
          ),
        },
      },
    },
    401: { description: "Invalid credentials", content: { "application/json": { schema: ErrorSchema } } },
  },
});

// ─── Records routes ───────────────────────────────────────────────────────────

const RecordSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string(),
  date: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const listRecordsRoute = createRoute({
  method: "get",
  path: "/api/records",
  tags: ["Records"],
  summary: "List all financial records",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      type: z.enum(["INCOME", "EXPENSE"]).optional(),
      category: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of records with pagination",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(RecordSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
  },
});

export const createRecordRoute = createRoute({
  method: "post",
  path: "/api/records",
  tags: ["Records"],
  summary: "Create a financial record (Admin and Analyst only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            amount: z.number().positive(),
            type: z.enum(["INCOME", "EXPENSE"]),
            category: z.string(),
            date: z.string(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Record created",
      content: { "application/json": { schema: successResponse(RecordSchema) } },
    },
    400: { description: "Validation error", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Forbidden — Viewer role cannot create records", content: { "application/json": { schema: ErrorSchema } } },
  },
});

// ─── Dashboard routes ─────────────────────────────────────────────────────────

export const dashboardRoute = createRoute({
  method: "get",
  path: "/api/dashboard",
  tags: ["Dashboard"],
  summary: "Get full dashboard — summary, categories, trends, recent activity",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Full dashboard data",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              summary: z.object({
                totalIncome: z.number(),
                totalExpenses: z.number(),
                netBalance: z.number(),
                totalTransactions: z.number(),
              }),
              categoryBreakdown: z.array(
                z.object({
                  category: z.string(),
                  type: z.string(),
                  total: z.number(),
                  count: z.number(),
                })
              ),
              monthlyTrend: z.array(
                z.object({
                  month: z.string(),
                  income: z.number(),
                  expenses: z.number(),
                  net: z.number(),
                })
              ),
              recentActivity: z.array(RecordSchema),
            })
          ),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
  },
});

export const summaryRoute = createRoute({
  method: "get",
  path: "/api/dashboard/summary",
  tags: ["Dashboard"],
  summary: "Get income, expenses and net balance",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Summary totals",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              totalIncome: z.number(),
              totalExpenses: z.number(),
              netBalance: z.number(),
              totalTransactions: z.number(),
            })
          ),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
  },
});