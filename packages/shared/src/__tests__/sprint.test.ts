import { describe, it, expect } from "vitest";
import {
  sprintSchema,
  createSprintSchema,
  updateSprintSchema,
} from "../schemas/sprint";

describe("sprintSchema", () => {
  const validSprint = {
    id: "sprint-123",
    name: "Week 14",
    startDate: "2026-03-30",
    endDate: "2026-04-06",
    todoIds: ["todo-1", "todo-2"],
    createdAt: "2026-03-30T00:00:00Z",
    updatedAt: "2026-03-30T00:00:00Z",
  };

  it("should accept a valid sprint", () => {
    const result = sprintSchema.safeParse(validSprint);
    expect(result.success).toBe(true);
  });

  it("should accept empty todoIds array", () => {
    const result = sprintSchema.safeParse({ ...validSprint, todoIds: [] });
    expect(result.success).toBe(true);
  });

  // name validation
  it("should reject empty name", () => {
    const result = sprintSchema.safeParse({ ...validSprint, name: "" });
    expect(result.success).toBe(false);
  });

  it("should accept name with 1 character", () => {
    const result = sprintSchema.safeParse({ ...validSprint, name: "A" });
    expect(result.success).toBe(true);
  });

  it("should accept name with 50 characters", () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      name: "a".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it("should reject name with 51 characters", () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  // date validation
  it('should accept startDate "2026-01-01"', () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      startDate: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it('should reject startDate "not-a-date"', () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      startDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it('should reject startDate "2026/01/01" (wrong separator)', () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      startDate: "2026/01/01",
    });
    expect(result.success).toBe(false);
  });

  it('should reject endDate "invalid"', () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      endDate: "invalid",
    });
    expect(result.success).toBe(false);
  });

  // todoIds validation
  it("should reject non-string elements in todoIds", () => {
    const result = sprintSchema.safeParse({
      ...validSprint,
      todoIds: [123],
    });
    expect(result.success).toBe(false);
  });
});

describe("createSprintSchema", () => {
  it("should accept a valid create payload", () => {
    const result = createSprintSchema.safeParse({
      name: "Week 14",
      startDate: "2026-03-30",
      endDate: "2026-04-06",
      todoIds: ["todo-1"],
    });
    expect(result.success).toBe(true);
  });

  it("should default todoIds to empty array when omitted", () => {
    const result = createSprintSchema.safeParse({
      name: "Week 14",
      startDate: "2026-03-30",
      endDate: "2026-04-06",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.todoIds).toEqual([]);
    }
  });

  it("should reject missing name", () => {
    const result = createSprintSchema.safeParse({
      startDate: "2026-03-30",
      endDate: "2026-04-06",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing startDate", () => {
    const result = createSprintSchema.safeParse({
      name: "Week 14",
      endDate: "2026-04-06",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing endDate", () => {
    const result = createSprintSchema.safeParse({
      name: "Week 14",
      startDate: "2026-03-30",
    });
    expect(result.success).toBe(false);
  });

  it("should not include id, createdAt, updatedAt fields", () => {
    const result = createSprintSchema.safeParse({
      name: "Sprint",
      startDate: "2026-03-30",
      endDate: "2026-04-06",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("createdAt");
      expect(result.data).not.toHaveProperty("updatedAt");
    }
  });
});

describe("updateSprintSchema", () => {
  it("should accept all fields as optional (empty object)", () => {
    const result = updateSprintSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only name", () => {
    const result = updateSprintSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only startDate", () => {
    const result = updateSprintSchema.safeParse({ startDate: "2026-04-01" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only endDate", () => {
    const result = updateSprintSchema.safeParse({ endDate: "2026-04-15" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only todoIds", () => {
    const result = updateSprintSchema.safeParse({ todoIds: ["todo-3"] });
    expect(result.success).toBe(true);
  });

  it("should still validate name constraints on partial update", () => {
    const result = updateSprintSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should still validate date format on partial update", () => {
    const result = updateSprintSchema.safeParse({ startDate: "invalid" });
    expect(result.success).toBe(false);
  });
});
