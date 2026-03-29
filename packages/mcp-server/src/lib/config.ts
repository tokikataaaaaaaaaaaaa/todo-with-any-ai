export interface Config {
  apiKey: string | null;
  apiUrl: string;
}

export function getConfig(): Config {
  const apiKey = parseApiKey();
  const apiUrl = process.env.TODO_API_URL || "http://localhost:5001/api";

  return { apiKey, apiUrl };
}

export function hasHelpFlag(): boolean {
  const args = process.argv.slice(2);
  return args.includes("--help") || args.includes("-h");
}

export function showHelp(): string {
  return `todo-with-any-ai-mcp - MCP server for todo-with-any-ai

Usage:
  npx todo-with-any-ai-mcp --api-key=YOUR_API_KEY

Options:
  --api-key <key>   API key for authentication (required)
  --help, -h        Show this help message

Environment Variables:
  TODO_API_KEY       API key (alternative to --api-key flag)
  TODO_API_URL       API base URL (default: http://localhost:5001/api)

Examples:
  npx todo-with-any-ai-mcp --api-key=abc123
  TODO_API_KEY=abc123 npx todo-with-any-ai-mcp`;
}

function parseApiKey(): string | null {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // --api-key=value
    if (arg.startsWith("--api-key=")) {
      return arg.split("=")[1];
    }

    // --api-key value
    if (arg === "--api-key" && i + 1 < args.length) {
      return args[i + 1];
    }
  }

  // Fallback to environment variable
  return process.env.TODO_API_KEY ?? null;
}
