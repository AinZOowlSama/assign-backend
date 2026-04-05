import { createMiddleware } from "hono/factory";
import type { ZodSchema } from "zod";

// ─── Validate Middleware ──────────────────────────────────────────────────────
// A generic middleware factory that accepts a Zod schema and validates
// the request body against it. On failure it returns a structured 400
// with field-level error details — never a raw Zod error object.
//
// Usage:
//   app.post('/records', authMiddleware, validate(CreateRecordSchema), handler)
//
// After this middleware runs, c.get('validatedBody') is fully typed.

declare module "hono" {
  interface ContextVariableMap {
    validatedBody: unknown;
    validatedQuery: unknown;
  }
}

export const validate = (schema: ZodSchema) =>
  createMiddleware(async (c, next) => {
    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { success: false, error: "Request body must be valid JSON" },
        400
      );
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        400
      );
    }

    c.set("validatedBody", result.data);
    await next();
  });

export const validateQuery = (schema: ZodSchema) =>
  createMiddleware(async (c, next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        400
      );
    }

    c.set("validatedQuery", result.data);
    await next();
  });
