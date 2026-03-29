import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function projectsUpdate(
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
  const project = await client.updateProject(id, data);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Project updated", project }, null, 2),
      },
    ],
  };
}
