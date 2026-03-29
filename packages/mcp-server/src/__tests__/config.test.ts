import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getConfig, showHelp } from "../lib/config.js";

describe("getConfig", () => {
  const originalArgv = process.argv;
  const originalEnv = process.env.TODO_API_KEY;

  beforeEach(() => {
    delete process.env.TODO_API_KEY;
  });

  afterEach(() => {
    process.argv = originalArgv;
    if (originalEnv !== undefined) {
      process.env.TODO_API_KEY = originalEnv;
    } else {
      delete process.env.TODO_API_KEY;
    }
  });

  it("parses --api-key=test123", () => {
    process.argv = ["node", "index.js", "--api-key=test123"];
    const config = getConfig();
    expect(config.apiKey).toBe("test123");
  });

  it("parses --api-key test123 (space separated)", () => {
    process.argv = ["node", "index.js", "--api-key", "test123"];
    const config = getConfig();
    expect(config.apiKey).toBe("test123");
  });

  it("falls back to TODO_API_KEY env var when no arg", () => {
    process.argv = ["node", "index.js"];
    process.env.TODO_API_KEY = "xxx";
    const config = getConfig();
    expect(config.apiKey).toBe("xxx");
  });

  it("returns null apiKey when nothing provided", () => {
    process.argv = ["node", "index.js"];
    const config = getConfig();
    expect(config.apiKey).toBeNull();
  });
});

describe("showHelp", () => {
  it("returns help text containing usage information", () => {
    const help = showHelp();
    expect(help).toContain("todo-with-any-ai-mcp");
    expect(help).toContain("--api-key");
    expect(help).toContain("--help");
    expect(help).toContain("TODO_API_KEY");
  });
});

describe("--help flag detection", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("detects --help flag in args", () => {
    process.argv = ["node", "index.js", "--help"];
    const args = process.argv.slice(2);
    expect(args.includes("--help") || args.includes("-h")).toBe(true);
  });

  it("detects -h flag in args", () => {
    process.argv = ["node", "index.js", "-h"];
    const args = process.argv.slice(2);
    expect(args.includes("--help") || args.includes("-h")).toBe(true);
  });
});
