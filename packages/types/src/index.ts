// ─── Role Enum ───────────────────────────────────────────────────────────────
export enum Role {
  VIEWER = "VIEWER",
  ANALYST = "ANALYST",
  ADMIN = "ADMIN",
}

// ─── Record Type Enum ─────────────────────────────────────────────────────────
export enum RecordType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

// ─── User Status Enum ─────────────────────────────────────────────────────────
export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;   // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Pagination Meta ──────────────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}
