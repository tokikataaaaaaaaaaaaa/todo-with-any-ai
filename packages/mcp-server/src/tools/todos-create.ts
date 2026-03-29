import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function todosCreate(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const title = args.title as string | undefined;

  if (!title) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: title is required" }],
    };
  }

  if (title.length > 255) {
    return {
      isError: true,
      content: [
        { type: "text" as const, text: "Error: title must be 255 characters or less" },
      ],
    };
  }

  const data: Record<string, unknown> = { title };
  if (args.parentId !== undefined) data.parentId = args.parentId;
  if (args.dueDate !== undefined) data.dueDate = args.dueDate;
  if (args.priority !== undefined) data.priority = args.priority;
  if (args.categoryIcon !== undefined) data.categoryIcon = args.categoryIcon;

  const todo = await client.createTodo(data as Parameters<ApiClient["createTodo"]>[0]);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Todo created", todo }, null, 2),
      },
    ],
  };
}
