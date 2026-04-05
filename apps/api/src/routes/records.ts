import { Hono } from "hono";
import { recordService } from "../services/recordService";
import { authMiddleware } from "../middleware/auth";
import { rbac, Roles } from "../middleware/rbac";
import { validate, validateQuery } from "../middleware/validate";
import {
  CreateRecordSchema,
  UpdateRecordSchema,
  RecordFilterSchema,
} from "@repo/validators";
import type { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from "@repo/validators";

// ─── Record Routes ────────────────────────────────────────────────────────────


export const recordRoutes = new Hono();



// GET /api/records — list with filters and pagination
recordRoutes.get(
  "/",
  authMiddleware,
  rbac(Roles.ALL),
  validateQuery(RecordFilterSchema),
  async (c) => {
    const filters = c.get("validatedQuery") as RecordFilterInput;
    const result = await recordService.listRecords(filters);

    return c.json({
      success: true,
      data: result.records,
      meta: result.meta,
    });
  }
);

// GET /api/records/:id — single record
recordRoutes.get("/:id", authMiddleware, rbac(Roles.ALL), async (c) => {
  const record = await recordService.getRecordById(c.req.param("id"));

  return c.json({ success: true, data: record });
});

// POST /api/records — create a new record
recordRoutes.post(
  "/",
  authMiddleware,
  rbac(Roles.ADMIN_ANALYST),
  validate(CreateRecordSchema),
  async (c) => {
    const input = c.get("validatedBody") as CreateRecordInput;
    const createdById = c.get("user").sub;
    const record = await recordService.createRecord(input, createdById);

    return c.json(
      {
        success: true,
        message: "Record created successfully",
        data: record,
      },
      201
    );
  }
);

// PATCH /api/records/:id — update a record
recordRoutes.patch(
  "/:id",
  authMiddleware,
  rbac(Roles.ADMIN_ONLY),
  validate(UpdateRecordSchema),
  async (c) => {
    const input = c.get("validatedBody") as UpdateRecordInput;
    const record = await recordService.updateRecord(c.req.param("id"), input);

    return c.json({
      success: true,
      message: "Record updated successfully",
      data: record,
    });
  }
);

// DELETE /api/records/:id — soft delete
recordRoutes.delete(
  "/:id",
  authMiddleware,
  rbac(Roles.ADMIN_ONLY),
  async (c) => {
    await recordService.deleteRecord(c.req.param("id"));

    return c.json({
      success: true,
      message: "Record deleted successfully",
    });
  }
);
