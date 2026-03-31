import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const sprintSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  startDate: dateString,
  endDate: dateString,
  todoIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createSprintSchema = z.object({
  name: z.string().min(1).max(50),
  startDate: dateString,
  endDate: dateString,
  todoIds: z.array(z.string()).default([]),
});

export const updateSprintSchema = createSprintSchema.partial();
