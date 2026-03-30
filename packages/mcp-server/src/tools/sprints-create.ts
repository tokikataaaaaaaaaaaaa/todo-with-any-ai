import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function sprintsCreate(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const name = args.name as string | undefined;

  if (!name) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: name is required" }],
    };
  }

  if (name.length > 50) {
    return {
      isError: true,
      content: [
        { type: "text" as const, text: "Error: name must be 50 characters or less" },
      ],
    };
  }

  const startDate = args.startDate as string | undefined;
  const endDate = args.endDate as string | undefined;

  if (!startDate || !endDate) {
    return {
      isError: true,
      content: [
        { type: "text" as const, text: "Error: startDate and endDate are required (YYYY-MM-DD)" },
      ],
    };
  }

  const data: Record<string, unknown> = { name, startDate, endDate };
  if (args.todoIds !== undefined) data.todoIds = args.todoIds;

  const sprint = await client.createSprint(data as Parameters<ApiClient["createSprint"]>[0]);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Sprint created", sprint }, null, 2),
      },
    ],
  };
}
