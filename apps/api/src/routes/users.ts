import { Hono } from "hono";
import { userService } from "../services/userService";
import { authMiddleware } from "../middleware/auth";
import { rbac, Roles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { UpdateUserSchema } from "@repo/validators";
import type { UpdateUserInput } from "@repo/validators";

// ─── User Routes ──────────────────────────────────────────────────────────────


export const userRoutes = new Hono();

// Apply authMiddleware to all user routes
userRoutes.use("*", authMiddleware);

// GET /api/users — list all users
userRoutes.get("/", rbac(Roles.ADMIN_ONLY), async (c) => {
  const users = await userService.listUsers();

  return c.json({ success: true, data: users });
});

// GET /api/users/profile — current user's own profile

userRoutes.get("/profile", rbac(Roles.ALL), async (c) => {
  const { sub } = c.get("user");
  const user = await userService.getProfile(sub);

  return c.json({ success: true, data: user });
});

// GET /api/users/:id — get user by id
userRoutes.get("/:id", rbac(Roles.ADMIN_ONLY), async (c) => {
  const user = await userService.getUserById(c.req.param("id"));

  return c.json({ success: true, data: user });
});

// PATCH /api/users/:id — update user role or status
userRoutes.patch(
  "/:id",
  rbac(Roles.ADMIN_ONLY),
  validate(UpdateUserSchema),
  async (c) => {
    const input = c.get("validatedBody") as UpdateUserInput;
    const user = await userService.updateUser(c.req.param("id"), input);

    return c.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  }
);

// DELETE /api/users/:id — deactivate user (soft)
userRoutes.delete("/:id", rbac(Roles.ADMIN_ONLY), async (c) => {
  const requestingUserId = c.get("user").sub;
  const user = await userService.deactivateUser(
    c.req.param("id"),
    requestingUserId
  );

  return c.json({
    success: true,
    message: "User deactivated successfully",
    data: user,
  });
});
