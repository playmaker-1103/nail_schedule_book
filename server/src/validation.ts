import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Must be a valid MongoDB id");
const colour = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #0f766e");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-MM-dd");
const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm");
const duration = z.number().int().min(15).max(240).refine((value) => value % 15 === 0, "Use 15 minute increments");

export const staffCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  colour,
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional()
});

export const staffPatchSchema = staffCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  defaultDuration: duration,
  colour,
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional()
});

export const servicePatchSchema = serviceCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const bookingCreateSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  serviceId: objectId,
  staffId: objectId,
  date: dateString,
  startTime: timeString,
  durationMinutes: duration,
  note: z.string().trim().max(500).optional().default("")
});

export const bookingPatchSchema = bookingCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const dateQuerySchema = z.object({
  date: dateString
});

export const idParamSchema = z.object({
  id: objectId
});
