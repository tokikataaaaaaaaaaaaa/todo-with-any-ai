import { z } from "zod";
import {
  todoSchema,
  createTodoSchema,
  updateTodoSchema,
  todoTreeNodeSchema,
  apiKeySchema,
  createApiKeySchema,
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
  sprintSchema,
  createSprintSchema,
  updateSprintSchema,
} from "../schemas";

export type Todo = z.infer<typeof todoSchema>;
export type CreateTodo = z.infer<typeof createTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type TodoTreeNode = z.infer<typeof todoTreeNodeSchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Sprint = z.infer<typeof sprintSchema>;
export type CreateSprint = z.infer<typeof createSprintSchema>;
export type UpdateSprint = z.infer<typeof updateSprintSchema>;
