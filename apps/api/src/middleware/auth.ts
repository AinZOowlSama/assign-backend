import { createMiddleware } from "hono/factory";
import { verify } from "jsonwebtoken";
import type { JWTPayload } from "@repo/types";

// ─── Hono Context Type Augmentation ──────────────────────────────────────────
// This tells TypeScript what shape c.get('user') will be throughout the app.
// Without this, every handler would need a cast — this makes it type-safe globally.
declare module "hono" {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Responsibilities:
//   1. Extract Bearer token from Authorization header
//   2. Verify the JWT signature
//   3. Attach the decoded payload (including role) to context
//
// It does NOT check roles — that's the job of rbac middleware.
// Separation of concerns: auth = "who are you", rbac = "what can you do".

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Authorization header missing or malformed" }, 401);
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const payload = verify(token, secret) as JWTPayload;
    c.set("user", payload); // now available as c.get('user') in all downstream handlers
    await next();
  } catch (err) {
    // Distinguish between expired vs invalid — useful for clients
    const isExpired = err instanceof Error && err.name === "TokenExpiredError";
    return c.json(
      {
        success: false,
        error: isExpired ? "Token has expired" : "Invalid token",
      },
      401
    );
  }
});
