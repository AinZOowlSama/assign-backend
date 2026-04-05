import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { recordRoutes } from "./routes/records";
import { dashboardRoutes } from "./routes/dashboard";

import {
  registerRoute,
  loginRoute,
  listRecordsRoute,
  createRecordRoute,
  dashboardRoute,
  summaryRoute,
} from "./openapi/registry";

const app = new OpenAPIHono();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({ success: true, message: "Finance API is running" })
);

// ─── Actual Routes (business logic) ───────────────────────────────────────────
app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api/records", recordRoutes);
app.route("/api/dashboard", dashboardRoutes);

// ─── OpenAPI Route Registration  ──────────────

app.openapi(registerRoute, (c) =>
  c.json({ success: true, message: "see /api/auth/register" } as any)
);
app.openapi(loginRoute, (c) =>
  c.json({ success: true, message: "see /api/auth/login" } as any)
);
app.openapi(listRecordsRoute, (c) =>
  c.json({ success: true, message: "see /api/records" } as any)
);
app.openapi(createRecordRoute, (c) =>
  c.json({ success: true, message: "see /api/records" } as any)
);
app.openapi(dashboardRoute, (c) =>
  c.json({ success: true, message: "see /api/dashboard" } as any)
);
app.openapi(summaryRoute, (c) =>
  c.json({ success: true, message: "see /api/dashboard/summary" } as any)
);

// ─── Security Scheme ───────────────────────────────────────────────────────────
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Paste the JWT token from POST /api/auth/login",
});

// ─── OpenAPI Spec endpoint ─────────────────────────────────────────────────────
app.doc("/docs/spec", {
  openapi: "3.0.0",
  info: {
    title: "Finance Dashboard API",
    version: "1.0.0",
    description:
      "Role-based finance dashboard backend. Login to get a JWT token then click Authorize to test protected endpoints.",
  },
});

// ─── Swagger UI ────────────────────────────────────────────────────────────────
// Visit http://localhost:3000/docs
app.get("/docs", swaggerUI({ url: "/docs/spec" }));

// ─── 404 and Error Handlers ────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ success: false, error: "Route not found" }, 404)
);
app.onError(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000);
console.log(` Finance API running on http://localhost:${port}`);
console.log(` Swagger docs at http://localhost:${port}/docs`);

serve({ fetch: app.fetch, port });

export default app;