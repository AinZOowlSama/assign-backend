import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "@repo/db";
import type { Role } from "@repo/types";
import type { RegisterInput, LoginInput } from "@repo/validators";
import { AppError } from "../middleware/errorHandler";

// ─── Auth Service ─────────────────────────────────────────────────────────────


export const authService = {
  // ── Register ────────────────────────────────────────────────────────────────
  async register(input: RegisterInput) {
   
    const hashedPassword = await bcrypt.hash(input.password, 10);

    
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: hashedPassword,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        
      },
    });

    const token = generateToken(user.id, user.email, user.role as Role);
    return { user, token };
  },

  // ── Login ───────────────────────────────────────────────────────────────────
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status === "INACTIVE") {
      throw new AppError("Your account has been deactivated", 403);
    }

    const token = generateToken(user.id, user.email, user.role as Role);

    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  },
};

// ─── Token Generator ──────────────────────────────────────────────────────────


function generateToken(userId: string, email: string, role: Role): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  return jwt.sign(
    { sub: userId, email, role },
    secret,
    { expiresIn }
  );
}
