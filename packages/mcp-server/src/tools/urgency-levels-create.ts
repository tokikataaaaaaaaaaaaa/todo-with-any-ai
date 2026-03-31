import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function urgencyLevelsCreate(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const name = args.name as string | undefined;
  const color = args.color as string | undefined;
  const icon = args.icon as string | undefined;

  if (!name) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: name is required" }],
    };
  }

  if (!color) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: color is required" }],
    };
  }

  if (!icon) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: icon is required" }],
    };
  }

  const urgencyLevel = await client.createUrgencyLevel({ name, color, icon });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Urgency level created", urgencyLevel }, null, 2),
      },
    ],
  };
}
