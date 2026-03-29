import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function projectsDelete(
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

  const deleteTodos = (args.deleteTodos as boolean) ?? false;
  const result = await client.deleteProject(id, deleteTodos);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { message: "Project deleted" },
          null,
          2
        ),
      },
    ],
  };
}
