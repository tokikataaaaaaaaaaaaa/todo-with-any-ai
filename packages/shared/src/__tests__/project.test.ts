import { describe, it, expect } from "vitest";
import {
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/project";

describe("projectSchema", () => {
  const validProject = {
    id: "proj-123",
    name: "My Project",
    color: "#FF5733",
    emoji: "\u{1F4BC}",
    order: 0,
    dueDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("should accept a valid project", () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  // name validation
  it("should reject empty name", () => {
    const result = projectSchema.safeParse({ ...validProject, name: "" });
    expect(result.success).toBe(false);
  });

  it("should accept name with 50 characters", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      name: "a".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it("should reject name with 51 characters", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("should accept name with 1 character", () => {
    const result = projectSchema.safeParse({ ...validProject, name: "A" });
    expect(result.success).toBe(true);
  });

  // color validation
  it('should accept color "#FF5733"', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      color: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it('should accept color "#000000"', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      color: "#000000",
    });
    expect(result.success).toBe(true);
  });

  it('should accept color "#ffffff" (lowercase)', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      color: "#ffffff",
    });
    expect(result.success).toBe(true);
  });

  it('should reject color "red"', () => {
    const result = projectSchema.safeParse({ ...validProject, color: "red" });
    expect(result.success).toBe(false);
  });

  it('should reject color "#GGG"', () => {
    const result = projectSchema.safeParse({ ...validProject, color: "#GGG" });
    expect(result.success).toBe(false);
  });

  it('should reject color "#GGGGGG"', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      color: "#GGGGGG",
    });
    expect(result.success).toBe(false);
  });

  it("should reject color without hash prefix", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      color: "FF5733",
    });
    expect(result.success).toBe(false);
  });

  // emoji validation
  it('should accept emoji "\u{1F4BC}"', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      emoji: "\u{1F4BC}",
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty string emoji ""', () => {
    const result = projectSchema.safeParse({ ...validProject, emoji: "" });
    expect(result.success).toBe(true);
  });

  it("should accept single character emoji", () => {
    const result = projectSchema.safeParse({ ...validProject, emoji: "A" });
    expect(result.success).toBe(true);
  });

  it("should reject emoji with more than 2 characters (string length)", () => {
    const result = projectSchema.safeParse({ ...validProject, emoji: "ABC" });
    expect(result.success).toBe(false);
  });

  // order validation
  it("should accept order 0", () => {
    const result = projectSchema.safeParse({ ...validProject, order: 0 });
    expect(result.success).toBe(true);
  });

  it("should accept order 100", () => {
    const result = projectSchema.safeParse({ ...validProject, order: 100 });
    expect(result.success).toBe(true);
  });

  it("should reject order -1", () => {
    const result = projectSchema.safeParse({ ...validProject, order: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer order 1.5", () => {
    const result = projectSchema.safeParse({ ...validProject, order: 1.5 });
    expect(result.success).toBe(false);
  });

  // dueDate validation
  it('should accept dueDate "2026-04-30"', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      dueDate: "2026-04-30",
    });
    expect(result.success).toBe(true);
  });

  it("should accept dueDate null", () => {
    const result = projectSchema.safeParse({ ...validProject, dueDate: null });
    expect(result.success).toBe(true);
  });

  it('should reject dueDate "not-a-date"', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      dueDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it('should reject dueDate "2026/04/30" (wrong separator)', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      dueDate: "2026/04/30",
    });
    expect(result.success).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("should accept a valid create payload", () => {
    const result = createProjectSchema.safeParse({
      name: "New Project",
      color: "#FF0000",
      emoji: "\u{1F680}",
    });
    expect(result.success).toBe(true);
  });

  it("should not require dueDate (defaults to null)", () => {
    const result = createProjectSchema.safeParse({
      name: "Project",
      color: "#000000",
      emoji: "P",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeNull();
    }
  });

  it("should accept dueDate when provided", () => {
    const result = createProjectSchema.safeParse({
      name: "Project",
      color: "#000000",
      emoji: "P",
      dueDate: "2026-12-31",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBe("2026-12-31");
    }
  });

  it("should reject missing name", () => {
    const result = createProjectSchema.safeParse({
      color: "#000000",
      emoji: "P",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing color", () => {
    const result = createProjectSchema.safeParse({
      name: "Project",
      emoji: "P",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing emoji", () => {
    const result = createProjectSchema.safeParse({
      name: "Project",
      color: "#000000",
    });
    expect(result.success).toBe(false);
  });

  it("should not include id, order, createdAt, updatedAt fields", () => {
    const result = createProjectSchema.safeParse({
      name: "Project",
      color: "#000000",
      emoji: "P",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("order");
      expect(result.data).not.toHaveProperty("createdAt");
      expect(result.data).not.toHaveProperty("updatedAt");
    }
  });
});

describe("updateProjectSchema", () => {
  it("should accept all fields as optional (empty object)", () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only name", () => {
    const result = updateProjectSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only color", () => {
    const result = updateProjectSchema.safeParse({ color: "#123456" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only emoji", () => {
    const result = updateProjectSchema.safeParse({ emoji: "\u{2B50}" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with only dueDate", () => {
    const result = updateProjectSchema.safeParse({ dueDate: "2026-06-15" });
    expect(result.success).toBe(true);
  });

  it("should still validate field constraints on partial update", () => {
    const result = updateProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should still validate color format on partial update", () => {
    const result = updateProjectSchema.safeParse({ color: "invalid" });
    expect(result.success).toBe(false);
  });
});
