import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function urgencyLevelsList(
  client: ApiClient
): Promise<ToolResponse> {
  const urgencyLevels = await client.listUrgencyLevels();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ count: urgencyLevels.length, urgencyLevels }, null, 2),
      },
    ],
  };
}
