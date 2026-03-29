import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApiClient } from "../lib/api-client.js";
import { handleToolCall } from "../tools/index.js";
import type { Todo } from "../lib/types.js";

function createMockClient() {
  return {
    listTodos: vi.fn(),
    getTodoTree: vi.fn(),
    getTodo: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    toggleComplete: vi.fn(),
  };
}

const sampleTodo: Todo = {
  id: "t1",
  title: "Sample Todo",
  completed: false,
  parentId: null,
  dueDate: null,
  priority: null,
  categoryIcon: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("todos_list - extended filters", () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  it("passes dueBefore filter to listTodos", async () => {
    client.listTodos.mockResolvedValue([]);

    await handleToolCall(client as unknown as ApiClient, "todos_list", {
      dueBefore: "2026-04-30",
    });

    expect(client.listTodos).toHaveBeenCalledWith(
      expect.objectContaining({ dueBefore: "2026-04-30" })
    );
  });

  it("passes sort=dueDate filter to listTodos", async () => {
    client.listTodos.mockResolvedValue([]);

    await handleToolCall(client as unknown as ApiClient, "todos_list", {
      sort: "dueDate",
    });

    expect(client.listTodos).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "dueDate" })
    );
  });

  it("passes dueBefore and sort combined to listTodos", async () => {
    client.listTodos.mockResolvedValue([]);

    await handleToolCall(client as unknown as ApiClient, "todos_list", {
      dueBefore: "2026-04-30",
      sort: "dueDate",
    });

    expect(client.listTodos).toHaveBeenCalledWith(
      expect.objectContaining({
        dueBefore: "2026-04-30",
        sort: "dueDate",
      })
    );
  });

  it("passes dueBefore with completed filter", async () => {
    client.listTodos.mockResolvedValue([]);

    await handleToolCall(client as unknown as ApiClient, "todos_list", {
      dueBefore: "2026-04-30",
      completed: false,
    });

    expect(client.listTodos).toHaveBeenCalledWith(
      expect.objectContaining({
        dueBefore: "2026-04-30",
        completed: false,
      })
    );
  });

  it("returns todos when dueBefore filter matches", async () => {
    const todo = { ...sampleTodo, dueDate: "2026-04-15" };
    client.listTodos.mockResolvedValue([todo]);

    const result = await handleToolCall(client as unknown as ApiClient, "todos_list", {
      dueBefore: "2026-04-30",
    });

    expect(result.content[0].text).toContain('"count": 1');
    expect(result.content[0].text).toContain("2026-04-15");
  });

  it("does not pass sort when not provided", async () => {
    client.listTodos.mockResolvedValue([]);

    await handleToolCall(client as unknown as ApiClient, "todos_list", {
      completed: true,
    });

    const calledWith = client.listTodos.mock.calls[0][0];
    expect(calledWith).not.toHaveProperty("sort");
    expect(calledWith).not.toHaveProperty("dueBefore");
  });
});
