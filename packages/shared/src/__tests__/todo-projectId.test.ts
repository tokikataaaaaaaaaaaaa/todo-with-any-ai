import { describe, it, expect } from "vitest";
import {
  todoSchema,
  createTodoSchema,
  updateTodoSchema,
} from "../schemas/todo";

describe("todoSchema - projectId field", () => {
  const baseTodo = {
    id: "abc-123",
    title: "Buy milk",
    completed: false,
    dueDate: null,
    parentId: null,
    order: 0,
    depth: 0,
    priority: null,
    categoryIcon: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("should accept projectId: null", () => {
    const result = todoSchema.safeParse({ ...baseTodo, projectId: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeNull();
    }
  });

  it('should accept projectId: "proj-abc"', () => {
    const result = todoSchema.safeParse({ ...baseTodo, projectId: "proj-abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe("proj-abc");
    }
  });

  it("should default projectId to null when omitted", () => {
    const result = todoSchema.safeParse(baseTodo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeNull();
    }
  });

  it("should reject projectId: 123 (non-string, non-null)", () => {
    const result = todoSchema.safeParse({ ...baseTodo, projectId: 123 });
    expect(result.success).toBe(false);
  });

  it("should accept empty string projectId", () => {
    const result = todoSchema.safeParse({ ...baseTodo, projectId: "" });
    expect(result.success).toBe(true);
  });
});

describe("createTodoSchema - projectId field", () => {
  it("should accept projectId in create payload", () => {
    const result = createTodoSchema.safeParse({
      title: "Test",
      projectId: "proj-abc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe("proj-abc");
    }
  });

  it("should default projectId to null when omitted in create", () => {
    const result = createTodoSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeNull();
    }
  });

  it("should accept projectId: null in create", () => {
    const result = createTodoSchema.safeParse({
      title: "Test",
      projectId: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeNull();
    }
  });
});

describe("updateTodoSchema - projectId field", () => {
  it("should accept projectId in update payload", () => {
    const result = updateTodoSchema.safeParse({ projectId: "proj-xyz" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe("proj-xyz");
    }
  });

  it("should accept projectId: null in update (to unassign)", () => {
    const result = updateTodoSchema.safeParse({ projectId: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeNull();
    }
  });
});
