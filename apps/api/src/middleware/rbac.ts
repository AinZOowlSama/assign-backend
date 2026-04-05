import { createMiddleware } from "hono/factory";
import { Role } from "@repo/types";

// ─── RBAC Middleware ──────────────────────────────────────────────────────────



export const rbac = (allowedRoles:readonly Role[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user"); // set by authMiddleware — always present here

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        },
        403
      );
    }

    await next();
  });

// ─── Convenience Presets ──────────────────────────────────────────────────────


export const Roles = {
  ADMIN_ONLY: [Role.ADMIN],
  ADMIN_ANALYST: [Role.ADMIN, Role.ANALYST],
  ALL: [Role.ADMIN, Role.ANALYST, Role.VIEWER],
} as const;
