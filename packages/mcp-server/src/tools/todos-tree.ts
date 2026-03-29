import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function todosTree(
  client: ApiClient
): Promise<ToolResponse> {
  const tree = await client.getTodoTree();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ tree }, null, 2),
      },
    ],
  };
}
