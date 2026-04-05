import { z } from "zod";
import { Role, RecordType, UserStatus } from "@repo/types";

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.nativeEnum(Role).optional().default(Role.VIEWER),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── User Validators ──────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

// ─── Financial Record Validators ──────────────────────────────────────────────

export const CreateRecordSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  type: z.nativeEnum(RecordType, {
    errorMap: () => ({ message: "Type must be INCOME or EXPENSE" }),
  }),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category too long"),
  date: z.coerce.date({ invalid_type_error: "Invalid date format" }),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const UpdateRecordSchema = CreateRecordSchema.partial();

// ─── Query / Filter Validators ────────────────────────────────────────────────
// 

export const RecordFilterSchema = z.object({
  type: z.nativeEnum(RecordType).optional(),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Dashboard Validators ─────────────────────────────────────────────────────

export const DashboardQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────


export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;
export type RecordFilterInput = z.infer<typeof RecordFilterSchema>;
export type DashboardQueryInput = z.infer<typeof DashboardQuerySchema>;
