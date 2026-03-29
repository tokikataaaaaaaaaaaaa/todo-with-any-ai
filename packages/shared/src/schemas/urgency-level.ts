import { z } from "zod";

export const urgencyLevelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(2),
  order: z.number().int().min(0),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUrgencyLevelSchema = z.object({
  name: z.string().min(1).max(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(2),
});

export const updateUrgencyLevelSchema = createUrgencyLevelSchema.partial();
