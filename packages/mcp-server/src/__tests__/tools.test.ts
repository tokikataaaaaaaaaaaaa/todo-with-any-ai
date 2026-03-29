import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApiClient } from "../lib/api-client.js";
import { handleToolCall } from "../tools/index.js";
import type { Todo, TodoTreeNode } from "../lib/types.js";

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

describe("handleToolCall", () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  describe("todos_list", () => {
    it("calls listTodos with no filters when no args provided", async () => {
      client.listTodos.mockResolvedValue([sampleTodo]);

      const result = await handleToolCall(client as unknown as ApiClient, "todos_list", {});

      expect(client.listTodos).toHaveBeenCalledWith({});
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Sample Todo");
    });

    it("calls listTodos with completed=true filter", async () => {
      client.listTodos.mockResolvedValue([]);

      await handleToolCall(client as unknown as ApiClient, "todos_list", { completed: true });

      expect(client.listTodos).toHaveBeenCalledWith({ completed: true });
    });

    it("calls listTodos with completed=false filter", async () => {
      client.listTodos.mockResolvedValue([]);

      await handleToolCall(client as unknown as ApiClient, "todos_list", { completed: false });

      expect(client.listTodos).toHaveBeenCalledWith({ completed: false });
    });

    it("calls listTodos with parentId filter", async () => {
      client.listTodos.mockResolvedValue([]);

      await handleToolCall(client as unknown as ApiClient, "todos_list", { parentId: "null" });

      expect(client.listTodos).toHaveBeenCalledWith({ parentId: "null" });
    });

    it("calls listTodos with both filters", async () => {
      client.listTodos.mockResolvedValue([]);

      await handleToolCall(client as unknown as ApiClient, "todos_list", {
        completed: false,
        parentId: "p1",
      });

      expect(client.listTodos).toHaveBeenCalledWith({ completed: false, parentId: "p1" });
    });

    it("returns count of 0 when no todos found", async () => {
      client.listTodos.mockResolvedValue([]);

      const result = await handleToolCall(client as unknown as ApiClient, "todos_list", {});

      expect(result.content[0].text).toContain('"count": 0');
    });

    it("returns count matching number of todos", async () => {
      client.listTodos.mockResolvedValue([sampleTodo, { ...sampleTodo, id: "t2" }]);

      const result = await handleToolCall(client as unknown as ApiClient, "todos_list", {});

      expect(result.content[0].text).toContain('"count": 2');
    });
  });

  describe("todos_create", () => {
    it("calls createTodo with title only", async () => {
      client.createTodo.mockResolvedValue({ ...sampleTodo, title: "New Task" });

      const result = await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title: "New Task",
      });

      expect(client.createTodo).toHaveBeenCalledWith({
        title: "New Task",
      });
      expect(result.content[0].text).toContain("New Task");
    });

    it("calls createTodo with all optional fields", async () => {
      client.createTodo.mockResolvedValue(sampleTodo);

      await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title: "Full Todo",
        parentId: "parent1",
        dueDate: "2026-04-01",
        priority: "high",
        categoryIcon: "work",
      });

      expect(client.createTodo).toHaveBeenCalledWith({
        title: "Full Todo",
        parentId: "parent1",
        dueDate: "2026-04-01",
        priority: "high",
        categoryIcon: "work",
      });
    });

    it("returns error when title is missing", async () => {
      const result = await handleToolCall(client as unknown as ApiClient, "todos_create", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("title");
    });

    it("returns error when title is empty string", async () => {
      const result = await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title: "",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("title");
    });

    it("returns error when title exceeds 255 characters", async () => {
      const longTitle = "a".repeat(256);
      const result = await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title: longTitle,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("255");
    });

    it("allows title of exactly 255 characters", async () => {
      const title = "a".repeat(255);
      client.createTodo.mockResolvedValue({ ...sampleTodo, title });

      const result = await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title,
      });

      expect(result.isError).toBeUndefined();
      expect(client.createTodo).toHaveBeenCalled();
    });
  });

  describe("todos_update", () => {
    it("calls updateTodo with id and data", async () => {
      client.updateTodo.mockResolvedValue({ ...sampleTodo, title: "Updated" });

      const result = await handleToolCall(client as unknown as ApiClient, "todos_update", {
        id: "t1",
        title: "Updated",
      });

      expect(client.updateTodo).toHaveBeenCalledWith("t1", { title: "Updated" });
      expect(result.content[0].text).toContain("Updated");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(client as unknown as ApiClient, "todos_update", {
        title: "No id",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });

    it("passes multiple update fields excluding id", async () => {
      client.updateTodo.mockResolvedValue(sampleTodo);

      await handleToolCall(client as unknown as ApiClient, "todos_update", {
        id: "t1",
        title: "New Title",
        priority: "low",
        dueDate: "2026-12-31",
      });

      expect(client.updateTodo).toHaveBeenCalledWith("t1", {
        title: "New Title",
        priority: "low",
        dueDate: "2026-12-31",
      });
    });
  });

  describe("todos_delete", () => {
    it("calls deleteTodo with id", async () => {
      client.deleteTodo.mockResolvedValue({ deletedCount: 2 });

      const result = await handleToolCall(client as unknown as ApiClient, "todos_delete", {
        id: "d1",
      });

      expect(client.deleteTodo).toHaveBeenCalledWith("d1");
      expect(result.content[0].text).toContain("2");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(client as unknown as ApiClient, "todos_delete", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });

    it("includes deletedCount in response", async () => {
      client.deleteTodo.mockResolvedValue({ deletedCount: 5 });

      const result = await handleToolCall(client as unknown as ApiClient, "todos_delete", {
        id: "d1",
      });

      expect(result.content[0].text).toContain('"deletedCount": 5');
    });
  });

  describe("todos_toggle_complete", () => {
    it("calls toggleComplete with id", async () => {
      client.toggleComplete.mockResolvedValue({ ...sampleTodo, completed: true });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_toggle_complete",
        { id: "t1" }
      );

      expect(client.toggleComplete).toHaveBeenCalledWith("t1");
      expect(result.content[0].text).toContain("t1");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_toggle_complete",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });

    it("shows toggled completion status in response", async () => {
      client.toggleComplete.mockResolvedValue({ ...sampleTodo, completed: true });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_toggle_complete",
        { id: "t1" }
      );

      expect(result.content[0].text).toContain('"completed": true');
    });
  });

  describe("todos_tree", () => {
    it("calls getTodoTree and returns tree structure", async () => {
      const tree: TodoTreeNode[] = [
        {
          ...sampleTodo,
          children: [
            { ...sampleTodo, id: "t2", title: "Child", children: [] },
          ],
        },
      ];
      client.getTodoTree.mockResolvedValue(tree);

      const result = await handleToolCall(client as unknown as ApiClient, "todos_tree", {});

      expect(client.getTodoTree).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Sample Todo");
      expect(result.content[0].text).toContain("Child");
    });

    it("returns empty tree when no todos exist", async () => {
      client.getTodoTree.mockResolvedValue([]);

      const result = await handleToolCall(client as unknown as ApiClient, "todos_tree", {});

      expect(result.content[0].text).toContain("[]");
    });
  });

  describe("unknown tool", () => {
    it("returns error for unknown tool name", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "unknown_tool",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown tool");
    });
  });

  describe("API error handling", () => {
    it("returns isError=true when listTodos throws 401", async () => {
      client.listTodos.mockRejectedValue(new Error("API error: 401 Unauthorized"));

      const result = await handleToolCall(client as unknown as ApiClient, "todos_list", {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("401");
    });

    it("returns isError=true when createTodo throws 500", async () => {
      client.createTodo.mockRejectedValue(new Error("API error: 500 Internal Server Error"));

      const result = await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title: "Test",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("500");
    });

    it("returns isError=true when deleteTodo throws 404", async () => {
      client.deleteTodo.mockRejectedValue(new Error("API error: 404 Not Found"));

      const result = await handleToolCall(client as unknown as ApiClient, "todos_delete", {
        id: "nonexistent",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("404");
    });

    it("returns isError=true when toggleComplete throws", async () => {
      client.toggleComplete.mockRejectedValue(new Error("Network error"));

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_toggle_complete",
        { id: "t1" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Network error");
    });
  });
});
