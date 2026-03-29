import { describe, it, expect } from "vitest";
import { todoSchema, createTodoSchema, updateTodoSchema, todoTreeNodeSchema } from "../schemas/todo";

describe("todoSchema", () => {
  const validTodo = {
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

  it("should accept a valid todo", () => {
    const result = todoSchema.safeParse(validTodo);
    expect(result.success).toBe(true);
  });

  // title validation
  it("should reject empty title", () => {
    const result = todoSchema.safeParse({ ...validTodo, title: "" });
    expect(result.success).toBe(false);
  });

  it("should accept title with 255 characters", () => {
    const result = todoSchema.safeParse({ ...validTodo, title: "a".repeat(255) });
    expect(result.success).toBe(true);
  });

  it("should reject title with 256 characters", () => {
    const result = todoSchema.safeParse({ ...validTodo, title: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  // depth validation
  it("should accept depth 0", () => {
    const result = todoSchema.safeParse({ ...validTodo, depth: 0 });
    expect(result.success).toBe(true);
  });

  it("should accept depth 10", () => {
    const result = todoSchema.safeParse({ ...validTodo, depth: 10 });
    expect(result.success).toBe(true);
  });

  it("should reject depth 11", () => {
    const result = todoSchema.safeParse({ ...validTodo, depth: 11 });
    expect(result.success).toBe(false);
  });

  // priority validation
  it.each(["high", "medium", "low"])("should accept priority '%s'", (priority) => {
    const result = todoSchema.safeParse({ ...validTodo, priority });
    expect(result.success).toBe(true);
  });

  it("should accept priority null", () => {
    const result = todoSchema.safeParse({ ...validTodo, priority: null });
    expect(result.success).toBe(true);
  });

  it("should reject invalid priority", () => {
    const result = todoSchema.safeParse({ ...validTodo, priority: "invalid" });
    expect(result.success).toBe(false);
  });

  // categoryIcon validation
  it.each(["work", "personal", "shopping", "health", "study", "idea"])(
    "should accept categoryIcon '%s'",
    (categoryIcon) => {
      const result = todoSchema.safeParse({ ...validTodo, categoryIcon });
      expect(result.success).toBe(true);
    }
  );

  it("should accept categoryIcon null", () => {
    const result = todoSchema.safeParse({ ...validTodo, categoryIcon: null });
    expect(result.success).toBe(true);
  });

  it("should reject invalid categoryIcon", () => {
    const result = todoSchema.safeParse({ ...validTodo, categoryIcon: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("createTodoSchema", () => {
  it("should accept a valid create payload", () => {
    const result = createTodoSchema.safeParse({ title: "New todo" });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = createTodoSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("should not require id, createdAt, updatedAt", () => {
    const result = createTodoSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(true);
  });
});

describe("updateTodoSchema", () => {
  it("should accept partial update with only title", () => {
    const result = updateTodoSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (no fields to update)", () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject empty title on update", () => {
    const result = updateTodoSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("todoTreeNodeSchema", () => {
  it("should accept a todo with empty children array", () => {
    const result = todoTreeNodeSchema.safeParse({
      id: "abc-123",
      title: "Parent",
      completed: false,
      dueDate: null,
      parentId: null,
      order: 0,
      depth: 0,
      priority: null,
      categoryIcon: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      children: [],
    });
    expect(result.success).toBe(true);
  });
});
