import { z } from "zod";
import {
  todoSchema,
  createTodoSchema,
  updateTodoSchema,
  todoTreeNodeSchema,
  apiKeySchema,
  createApiKeySchema,
} from "../schemas";

export type Todo = z.infer<typeof todoSchema>;
export type CreateTodo = z.infer<typeof createTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type TodoTreeNode = z.infer<typeof todoTreeNodeSchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
