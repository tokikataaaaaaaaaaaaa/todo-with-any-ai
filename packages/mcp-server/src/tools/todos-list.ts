import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function todosList(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const filters: {
    completed?: boolean;
    parentId?: string;
    sort?: 'order' | 'dueDate';
    dueBefore?: string;
  } = {};
  if (args.completed !== undefined) {
    filters.completed = args.completed as boolean;
  }
  if (args.parentId !== undefined) {
    filters.parentId = args.parentId as string;
  }
  if (args.sort !== undefined) {
    filters.sort = args.sort as 'order' | 'dueDate';
  }
  if (args.dueBefore !== undefined) {
    filters.dueBefore = args.dueBefore as string;
  }

  const todos = await client.listTodos(filters);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ count: todos.length, todos }, null, 2),
      },
    ],
  };
}
