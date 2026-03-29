import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function todosUpdate(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const id = args.id as string | undefined;

  if (!id) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: id is required" }],
    };
  }

  const { id: _id, ...data } = args;
  const todo = await client.updateTodo(id, data);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Todo updated", todo }, null, 2),
      },
    ],
  };
}
