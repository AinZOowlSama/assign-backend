import { prisma } from "@repo/db";
import type { UpdateUserInput } from "@repo/validators";
import { AppError } from "../middleware/errorHandler";

// ─── Safe User Select ─────────────────────────────────────────────────────────

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── User Service ─────────────────────────────────────────────────────────────

export const userService = {
  // ── List All Users (Admin only) ──────────────────────────────────────────────
  async listUsers() {
    return prisma.user.findMany({
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  },

  // ── Get Single User ──────────────────────────────────────────────────────────
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  // ── Update User (Admin only) ─────────────────────────────────────────────────
  
  async updateUser(id: string, input: UpdateUserInput) {
    
    await userService.getUserById(id);

    return prisma.user.update({
      where: { id },
      data: input,
      select: SAFE_USER_SELECT,
    });
  },

  // ── Deactivate User (Admin only) ─────────────────────────────────────────────

  async deactivateUser(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new AppError("You cannot deactivate your own account", 400);
    }

    await userService.getUserById(id);

    return prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: SAFE_USER_SELECT,
    });
  },

  // ── Get Current User Profile ─────────────────────────────────────────────────
  async getProfile(id: string) {
    return userService.getUserById(id);
  },
};
