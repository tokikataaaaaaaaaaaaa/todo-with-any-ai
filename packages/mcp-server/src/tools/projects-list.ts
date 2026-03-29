import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function projectsList(
  client: ApiClient
): Promise<ToolResponse> {
  const projects = await client.listProjects();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ count: projects.length, projects }, null, 2),
      },
    ],
  };
}
