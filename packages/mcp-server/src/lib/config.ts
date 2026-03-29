export interface Config {
  apiKey: string | null;
  apiUrl: string;
}

export function getConfig(): Config {
  const apiKey = parseApiKey();
  const apiUrl = process.env.TODO_API_URL || "http://localhost:5001/api";

  return { apiKey, apiUrl };
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
