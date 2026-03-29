import { z } from "zod";

export const todoSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(255, "タイトルは255文字以内で入力してください"),
  completed: z.boolean().default(false),
  dueDate: z.string().nullable().default(null),
  parentId: z.string().nullable().default(null),
  order: z.number().int().min(0).default(0),
  depth: z
    .number()
    .int()
    .min(0)
    .max(10, "ネスト深度は最大10階層までです")
    .default(0),
  priority: z.enum(["high", "medium", "low"]).nullable().default(null),
  categoryIcon: z
    .enum(["work", "personal", "shopping", "health", "study", "idea"])
    .nullable()
    .default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createTodoSchema = todoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTodoSchema = todoSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const todoTreeNodeSchema: z.ZodType = todoSchema.extend({
  children: z.lazy(() => z.array(todoTreeNodeSchema)),
});
