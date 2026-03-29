import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function projectsCreate(
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

  const data: Record<string, unknown> = { name };
  if (args.color !== undefined) data.color = args.color;
  if (args.emoji !== undefined) data.emoji = args.emoji;
  if (args.dueDate !== undefined) data.dueDate = args.dueDate;

  const project = await client.createProject(data as Parameters<ApiClient["createProject"]>[0]);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Project created", project }, null, 2),
      },
    ],
  };
}
