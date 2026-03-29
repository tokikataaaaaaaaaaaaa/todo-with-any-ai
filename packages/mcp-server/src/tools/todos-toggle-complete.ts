import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function todosToggleComplete(
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

  const todo = await client.toggleComplete(id);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Todo toggled", todo }, null, 2),
      },
    ],
  };
}
