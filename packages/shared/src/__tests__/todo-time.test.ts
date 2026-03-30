import { describe, it, expect } from "vitest";
import { todoSchema, createTodoSchema, updateTodoSchema } from "../schemas/todo";

const baseTodo = {
  id: "abc-123",
  title: "Buy milk",
  completed: false,
  dueDate: "2026-04-01",
  parentId: null,
  order: 0,
  depth: 0,
  priority: null,
  categoryIcon: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("todoSchema - startTime/endTime validation", () => {
  it("should accept startTime and endTime when dueDate is set", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: "2026-04-01",
      startTime: "09:00",
      endTime: "10:00",
    });
    expect(result.success).toBe(true);
  });

  it("should accept startTime only when dueDate is set", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: "2026-04-01",
      startTime: "09:00",
      endTime: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept endTime only when dueDate is set", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: "2026-04-01",
      startTime: null,
      endTime: "10:00",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null startTime and null endTime when dueDate is set", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: "2026-04-01",
      startTime: null,
      endTime: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject startTime when dueDate is null", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: null,
      startTime: "09:00",
      endTime: null,
    });
    expect(result.success).toBe(false);
  });

  it("should reject endTime when dueDate is null", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: null,
      startTime: null,
      endTime: "10:00",
    });
    expect(result.success).toBe(false);
  });

  it("should accept null startTime and endTime when dueDate is null", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: null,
      startTime: null,
      endTime: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid startTime format", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: "2026-04-01",
      startTime: "9:00",
      endTime: null,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid endTime format (not HH:MM)", () => {
    const result = todoSchema.safeParse({
      ...baseTodo,
      dueDate: "2026-04-01",
      startTime: null,
      endTime: "5:00",
    });
    expect(result.success).toBe(false);
  });

  it("should default startTime and endTime to null when omitted", () => {
    const result = todoSchema.safeParse(baseTodo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBeNull();
      expect(result.data.endTime).toBeNull();
    }
  });
});

describe("createTodoSchema - startTime/endTime", () => {
  it("should accept startTime and endTime with dueDate", () => {
    const result = createTodoSchema.safeParse({
      title: "Test",
      dueDate: "2026-04-01",
      startTime: "09:00",
      endTime: "10:00",
    });
    expect(result.success).toBe(true);
  });

  it("should reject startTime without dueDate", () => {
    const result = createTodoSchema.safeParse({
      title: "Test",
      dueDate: null,
      startTime: "09:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTodoSchema - startTime/endTime", () => {
  it("should accept partial update with startTime only", () => {
    const result = updateTodoSchema.safeParse({
      startTime: "14:00",
    });
    // updateTodoSchema is partial, so we cannot validate cross-field
    // startTime alone is valid as a partial update (dueDate already exists on server)
    expect(result.success).toBe(true);
  });

  it("should accept partial update with endTime only", () => {
    const result = updateTodoSchema.safeParse({
      endTime: "15:00",
    });
    expect(result.success).toBe(true);
  });

  it("should accept clearing startTime and endTime", () => {
    const result = updateTodoSchema.safeParse({
      startTime: null,
      endTime: null,
    });
    expect(result.success).toBe(true);
  });
});
