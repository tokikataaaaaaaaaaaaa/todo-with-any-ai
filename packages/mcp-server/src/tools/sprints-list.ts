import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function sprintsList(
  client: ApiClient
): Promise<ToolResponse> {
  const sprints = await client.listSprints();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ count: sprints.length, sprints }, null, 2),
      },
    ],
  };
}
