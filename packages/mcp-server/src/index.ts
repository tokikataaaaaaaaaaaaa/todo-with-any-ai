#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getConfig, hasHelpFlag, showHelp } from "./lib/config.js";
import { ApiClient } from "./lib/api-client.js";
import { registerTools } from "./tools/index.js";

async function main() {
  if (hasHelpFlag()) {
    console.log(showHelp());
    process.exit(0);
  }

  const config = getConfig();

  if (!config.apiKey) {
    console.error(
      "--api-key is required. Usage: npx todo-with-any-ai-mcp --api-key=YOUR_API_KEY"
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "todo-with-any-ai",
    version: "0.1.0",
  });

  const client = new ApiClient(config);
  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
