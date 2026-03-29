import { describe, it, expect } from "vitest";
import { apiKeySchema, createApiKeySchema } from "../schemas/api-key";

describe("apiKeySchema", () => {
  const validApiKey = {
    id: "key-123",
    name: "My API Key",
    keyHash: "abc123hash",
    createdAt: "2026-01-01T00:00:00Z",
    lastUsedAt: null,
  };

  it("should accept a valid api key", () => {
    const result = apiKeySchema.safeParse(validApiKey);
    expect(result.success).toBe(true);
  });

  it("should accept lastUsedAt as string", () => {
    const result = apiKeySchema.safeParse({ ...validApiKey, lastUsedAt: "2026-01-02T00:00:00Z" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = apiKeySchema.safeParse({ ...validApiKey, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject name over 100 characters", () => {
    const result = apiKeySchema.safeParse({ ...validApiKey, name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("createApiKeySchema", () => {
  it("should accept a valid name", () => {
    const result = createApiKeySchema.safeParse({ name: "My Key" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createApiKeySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject name over 100 characters", () => {
    const result = createApiKeySchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});
