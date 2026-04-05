import { Hono } from "hono";
import { authService } from "../services/authService";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { RegisterSchema, LoginSchema } from "@repo/validators";
import type { RegisterInput, LoginInput } from "@repo/validators";

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// Each handler: validate → call service → return response.

export const authRoutes = new Hono();

// POST /api/auth/register
authRoutes.post("/register", validate(RegisterSchema), async (c) => {
  const input = c.get("validatedBody") as RegisterInput;
  const result = await authService.register(input);

  return c.json(
    {
      success: true,
      message: "Account created successfully",
      data: result,
    },
    201
  );
});

// POST /api/auth/login
authRoutes.post("/login", validate(LoginSchema), async (c) => {
  const input = c.get("validatedBody") as LoginInput;
  const result = await authService.login(input);

  return c.json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

// GET /api/auth/me  — returns the current user from the JWT
authRoutes.get("/me", authMiddleware, async (c) => {
  const { sub, email, role } = c.get("user");

  return c.json({
    success: true,
    data: { id: sub, email, role },
  });
});
