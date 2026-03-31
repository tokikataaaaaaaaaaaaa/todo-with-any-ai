import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function sprintsRemoveTodo(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const sprintId = args.sprintId as string | undefined;
  const todoId = args.todoId as string | undefined;

  if (!sprintId) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: sprintId is required" }],
    };
  }

  if (!todoId) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: todoId is required" }],
    };
  }

  const sprint = await client.removeTodoFromSprint(sprintId, todoId);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Todo removed from sprint", sprint }, null, 2),
      },
    ],
  };
}
