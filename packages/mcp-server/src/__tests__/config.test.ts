import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getConfig } from "../lib/config.js";

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
