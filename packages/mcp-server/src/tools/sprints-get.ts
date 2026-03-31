import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function sprintsGet(
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

  const sprint = await client.getSprint(id);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ sprint }, null, 2),
      },
    ],
  };
}
