import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

const todoBaseSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(255, "タイトルは255文字以内で入力してください"),
  completed: z.boolean().default(false),
  dueDate: z.string().nullable().default(null),
  startTime: z.string().regex(timeRegex, "HH:MM形式で入力してください").nullable().default(null),
  endTime: z.string().regex(timeRegex, "HH:MM形式で入力してください").nullable().default(null),
  parentId: z.string().nullable().default(null),
  order: z.number().int().min(0).default(0),
  depth: z
    .number()
    .int()
    .min(0)
    .max(10, "ネスト深度は最大10階層までです")
    .default(0),
  projectId: z.string().nullable().default(null),
  priority: z.enum(["high", "medium", "low"]).nullable().default(null),
  urgencyLevelId: z.string().nullable().default(null),
  categoryIcon: z
    .enum(["work", "personal", "shopping", "health", "study", "idea"])
    .nullable()
    .default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const dueDateTimeRefine = (data: { dueDate?: string | null; startTime?: string | null; endTime?: string | null }) => {
  if (data.dueDate === null || data.dueDate === undefined) {
    return (data.startTime === null || data.startTime === undefined) &&
           (data.endTime === null || data.endTime === undefined);
  }
  return true;
};

const dueDateTimeMessage = "期限日が未設定の場合、開始時間・終了時間は設定できません";

export const todoSchema = todoBaseSchema.refine(dueDateTimeRefine, { message: dueDateTimeMessage });

export const createTodoSchema = todoBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(dueDateTimeRefine, { message: dueDateTimeMessage });

export const updateTodoSchema = todoBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const todoTreeNodeSchema: z.ZodType = todoBaseSchema.extend({
  children: z.lazy(() => z.array(todoTreeNodeSchema)),
});
