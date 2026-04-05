import type { Context } from "hono";
import { Prisma } from "@repo/db";

// ─── Global Error Handler ─────────────────────────────────────────────────────


export const errorHandler = (err: Error, c: Context) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // ── Prisma: Record not found ──────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;
    if (prismaErr.code === "P2025") {
      return c.json({ success: false, error: "Record not found" }, 404);
    }

    // Unique constraint violation (e.g. duplicate email)
    if (prismaErr.code === "P2002") {
      const field = (prismaErr.meta?.target as string[])?.join(", ") ?? "field";
      return c.json(
        { success: false, error: `A record with this ${field} already exists` },
        409
      );
    }

    // Foreign key constraint failure
    if (prismaErr.code === "P2003") {
      return c.json(
        { success: false, error: "Related record does not exist" },
        400
      );
    }
  }

  // ── Prisma: Validation error ───────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    return c.json({ success: false, error: "Invalid data provided" }, 400);
  }

  // ── App-level errors with explicit status codes ────────────────────────────
  if (err instanceof AppError) {
    return c.json({ success: false, error: err.message }, 400);
  }

  // ── Unexpected errors ──────────────────────────────────────────────────────
  
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "An unexpected error occurred";

  return c.json({ success: false, error: message }, 500);
};

// ─── AppError ────────────────────────────────────────────────────────────────


export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}
