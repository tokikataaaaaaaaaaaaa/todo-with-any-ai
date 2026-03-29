import { describe, it, expect } from "vitest";
import {
  urgencyLevelSchema,
  createUrgencyLevelSchema,
  updateUrgencyLevelSchema,
} from "../schemas/urgency-level";

describe("urgencyLevelSchema", () => {
  const validLevel = {
    id: "level-1",
    name: "緊急",
    color: "#DC2626",
    icon: "🔴",
    order: 0,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("should accept a valid urgency level", () => {
    const result = urgencyLevelSchema.safeParse(validLevel);
    expect(result.success).toBe(true);
  });

  // name validation
  it("should reject empty name", () => {
    const result = urgencyLevelSchema.safeParse({ ...validLevel, name: "" });
    expect(result.success).toBe(false);
  });

  it("should accept name with 20 characters", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      name: "a".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  it("should reject name with 21 characters", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      name: "a".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("should accept single character name", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      name: "A",
    });
    expect(result.success).toBe(true);
  });

  // color validation
  it("should accept valid hex color", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      color: "#AABBCC",
    });
    expect(result.success).toBe(true);
  });

  it("should accept lowercase hex color", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      color: "#aabbcc",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid color (no hash)", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      color: "DC2626",
    });
    expect(result.success).toBe(false);
  });

  it("should reject 3-digit hex color", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      color: "#ABC",
    });
    expect(result.success).toBe(false);
  });

  it("should reject color with invalid characters", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      color: "#GGHHII",
    });
    expect(result.success).toBe(false);
  });

  // icon validation
  it("should accept emoji icon", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      icon: "🔴",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty icon", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      icon: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept 2-character icon", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      icon: "AB",
    });
    expect(result.success).toBe(true);
  });

  // order validation
  it("should accept order 0", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should accept positive order", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      order: 100,
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative order", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer order", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      order: 1.5,
    });
    expect(result.success).toBe(false);
  });

  // isDefault validation
  it("should accept isDefault true", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept isDefault false", () => {
    const result = urgencyLevelSchema.safeParse({
      ...validLevel,
      isDefault: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("createUrgencyLevelSchema", () => {
  it("should accept valid create payload", () => {
    const result = createUrgencyLevelSchema.safeParse({
      name: "カスタム",
      color: "#FF0000",
      icon: "🔥",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing name", () => {
    const result = createUrgencyLevelSchema.safeParse({
      color: "#FF0000",
      icon: "🔥",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing color", () => {
    const result = createUrgencyLevelSchema.safeParse({
      name: "カスタム",
      icon: "🔥",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing icon", () => {
    const result = createUrgencyLevelSchema.safeParse({
      name: "カスタム",
      color: "#FF0000",
    });
    expect(result.success).toBe(false);
  });

  it("should not include id, order, isDefault, timestamps", () => {
    const result = createUrgencyLevelSchema.safeParse({
      name: "Test",
      color: "#000000",
      icon: "T",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data).not.toHaveProperty("id");
      expect(data).not.toHaveProperty("order");
      expect(data).not.toHaveProperty("isDefault");
      expect(data).not.toHaveProperty("createdAt");
    }
  });
});

describe("updateUrgencyLevelSchema", () => {
  it("should accept partial update with only name", () => {
    const result = updateUrgencyLevelSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only color", () => {
    const result = updateUrgencyLevelSchema.safeParse({ color: "#00FF00" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only icon", () => {
    const result = updateUrgencyLevelSchema.safeParse({ icon: "🟢" });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (no fields to update)", () => {
    const result = updateUrgencyLevelSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject empty name on update", () => {
    const result = updateUrgencyLevelSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid color on update", () => {
    const result = updateUrgencyLevelSchema.safeParse({ color: "red" });
    expect(result.success).toBe(false);
  });
});
