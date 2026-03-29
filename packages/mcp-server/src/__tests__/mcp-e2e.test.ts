import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ApiClient } from "../lib/api-client.js";
import { registerTools } from "../tools/index.js";
import type { Todo, TodoTreeNode } from "../lib/types.js";

// --- Mock ApiClient ---

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

// --- Helpers ---

type TextContent = { type: string; text: string };

/** Extract the first text content from a callTool result, handling the `unknown` content type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTextContent(result: any): TextContent {
  const content = result.content as TextContent[];
  return content[0];
}

// --- Test Suite ---

describe("MCP Server E2E (InMemoryTransport)", () => {
  let mcpServer: McpServer;
  let mcpClient: Client;
  let mockApiClient: ReturnType<typeof createMockClient>;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    mockApiClient = createMockClient();

    mcpServer = new McpServer({
      name: "todo-with-any-ai",
      version: "0.1.0",
    });

    registerTools(mcpServer, mockApiClient as unknown as ApiClient);

    mcpClient = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await mcpServer.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  });

  afterAll(async () => {
    await mcpClient.close();
    await mcpServer.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Tool Listing
  // =========================================================================

  describe("listTools - tool registration", () => {
    it("returns exactly 6 tools", async () => {
      const result = await mcpClient.listTools();
      expect(result.tools).toHaveLength(6);
    });

    it("includes todos_list tool", async () => {
      const result = await mcpClient.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain("todos_list");
    });

    it("includes todos_create tool", async () => {
      const result = await mcpClient.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain("todos_create");
    });

    it("includes todos_update tool", async () => {
      const result = await mcpClient.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain("todos_update");
    });

    it("includes todos_delete tool", async () => {
      const result = await mcpClient.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain("todos_delete");
    });

    it("includes todos_toggle_complete tool", async () => {
      const result = await mcpClient.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain("todos_toggle_complete");
    });

    it("includes todos_tree tool", async () => {
      const result = await mcpClient.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain("todos_tree");
    });

    it("each tool has a description", async () => {
      const result = await mcpClient.listTools();
      for (const tool of result.tools) {
        expect(tool.description).toBeTruthy();
        expect(typeof tool.description).toBe("string");
      }
    });

    it("each tool has an inputSchema", async () => {
      const result = await mcpClient.listTools();
      for (const tool of result.tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });
  });

  // =========================================================================
  // todos_list
  // =========================================================================

  describe("todos_list", () => {
    it("returns text response with todos", async () => {
      mockApiClient.listTodos.mockResolvedValue([sampleTodo]);

      const result = await mcpClient.callTool({
        name: "todos_list",
        arguments: {},
      });

      expect(result.content as TextContent[]).toHaveLength(1);
      const textContent = getTextContent(result);
      expect(textContent.type).toBe("text");
      expect(textContent.text).toContain("Sample Todo");
    });

    it("returns count in response", async () => {
      mockApiClient.listTodos.mockResolvedValue([sampleTodo, { ...sampleTodo, id: "t2" }]);

      const result = await mcpClient.callTool({
        name: "todos_list",
        arguments: {},
      });

      const textContent = getTextContent(result);
      expect(textContent.text).toContain('"count": 2');
    });

    it("passes completed=true filter to ApiClient", async () => {
      mockApiClient.listTodos.mockResolvedValue([]);

      await mcpClient.callTool({
        name: "todos_list",
        arguments: { completed: true },
      });

      expect(mockApiClient.listTodos).toHaveBeenCalledWith(
        expect.objectContaining({ completed: true })
      );
    });

    it("passes completed=false filter to ApiClient", async () => {
      mockApiClient.listTodos.mockResolvedValue([]);

      await mcpClient.callTool({
        name: "todos_list",
        arguments: { completed: false },
      });

      expect(mockApiClient.listTodos).toHaveBeenCalledWith(
        expect.objectContaining({ completed: false })
      );
    });

    it("returns empty list when no todos exist", async () => {
      mockApiClient.listTodos.mockResolvedValue([]);

      const result = await mcpClient.callTool({
        name: "todos_list",
        arguments: {},
      });

      const textContent = getTextContent(result);
      expect(textContent.text).toContain('"count": 0');
      expect(textContent.text).toContain('"todos": []');
    });
  });

  // =========================================================================
  // todos_create
  // =========================================================================

  describe("todos_create", () => {
    it("creates a todo with title and returns it", async () => {
      const created = { ...sampleTodo, title: "New Task" };
      mockApiClient.createTodo.mockResolvedValue(created);

      const result = await mcpClient.callTool({
        name: "todos_create",
        arguments: { title: "New Task" },
      });

      expect(result.isError).toBeFalsy();
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("New Task");
      expect(textContent.text).toContain("Todo created");
    });

    it("passes all optional fields to ApiClient", async () => {
      mockApiClient.createTodo.mockResolvedValue(sampleTodo);

      await mcpClient.callTool({
        name: "todos_create",
        arguments: {
          title: "Full Todo",
          parentId: "p1",
          dueDate: "2026-04-01",
          priority: "high",
          categoryIcon: "work",
        },
      });

      expect(mockApiClient.createTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Full Todo",
          parentId: "p1",
          dueDate: "2026-04-01",
          priority: "high",
          categoryIcon: "work",
        })
      );
    });

    it("returns error when title is not provided", async () => {
      // The MCP SDK validates required params via zod schema.
      // title is required in the schema, so calling without it should error.
      // However, the zod schema marks title as required, so the SDK may reject
      // before our handler runs. We test the handler's own validation by
      // checking the response.
      const result = await mcpClient.callTool({
        name: "todos_create",
        arguments: {},
      });

      // Either SDK-level validation error or our handler error
      expect(result.isError).toBeTruthy();
    });

    it("returns error response content as text", async () => {
      const result = await mcpClient.callTool({
        name: "todos_create",
        arguments: {},
      });

      const content = result.content as TextContent[];
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // todos_update
  // =========================================================================

  describe("todos_update", () => {
    it("updates a todo with id and data", async () => {
      const updated = { ...sampleTodo, title: "Updated Title" };
      mockApiClient.updateTodo.mockResolvedValue(updated);

      const result = await mcpClient.callTool({
        name: "todos_update",
        arguments: { id: "t1", title: "Updated Title" },
      });

      expect(result.isError).toBeFalsy();
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Updated Title");
      expect(textContent.text).toContain("Todo updated");
    });

    it("calls updateTodo with correct id", async () => {
      mockApiClient.updateTodo.mockResolvedValue(sampleTodo);

      await mcpClient.callTool({
        name: "todos_update",
        arguments: { id: "update-id-123", title: "test" },
      });

      expect(mockApiClient.updateTodo).toHaveBeenCalledWith(
        "update-id-123",
        expect.any(Object)
      );
    });

    it("returns error when id is not provided", async () => {
      const result = await mcpClient.callTool({
        name: "todos_update",
        arguments: {},
      });

      expect(result.isError).toBeTruthy();
    });
  });

  // =========================================================================
  // todos_delete
  // =========================================================================

  describe("todos_delete", () => {
    it("deletes a todo and returns delete message", async () => {
      mockApiClient.deleteTodo.mockResolvedValue({ deletedCount: 1 });

      const result = await mcpClient.callTool({
        name: "todos_delete",
        arguments: { id: "d1" },
      });

      expect(result.isError).toBeFalsy();
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Todo deleted");
      expect(textContent.text).toContain("deletedCount");
    });

    it("includes deletedCount in response", async () => {
      mockApiClient.deleteTodo.mockResolvedValue({ deletedCount: 3 });

      const result = await mcpClient.callTool({
        name: "todos_delete",
        arguments: { id: "d1" },
      });

      const textContent = getTextContent(result);
      expect(textContent.text).toContain('"deletedCount": 3');
    });

    it("returns error when id is not provided", async () => {
      const result = await mcpClient.callTool({
        name: "todos_delete",
        arguments: {},
      });

      expect(result.isError).toBeTruthy();
    });
  });

  // =========================================================================
  // todos_toggle_complete
  // =========================================================================

  describe("todos_toggle_complete", () => {
    it("toggles completion and returns result", async () => {
      const toggled = { ...sampleTodo, completed: true };
      mockApiClient.toggleComplete.mockResolvedValue(toggled);

      const result = await mcpClient.callTool({
        name: "todos_toggle_complete",
        arguments: { id: "t1" },
      });

      expect(result.isError).toBeFalsy();
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Todo toggled");
      expect(textContent.text).toContain('"completed": true');
    });

    it("calls toggleComplete with correct id", async () => {
      mockApiClient.toggleComplete.mockResolvedValue({ ...sampleTodo, completed: true });

      await mcpClient.callTool({
        name: "todos_toggle_complete",
        arguments: { id: "toggle-id-456" },
      });

      expect(mockApiClient.toggleComplete).toHaveBeenCalledWith("toggle-id-456");
    });

    it("returns error when id is not provided", async () => {
      const result = await mcpClient.callTool({
        name: "todos_toggle_complete",
        arguments: {},
      });

      expect(result.isError).toBeTruthy();
    });
  });

  // =========================================================================
  // todos_tree
  // =========================================================================

  describe("todos_tree", () => {
    it("returns tree JSON structure", async () => {
      const tree: TodoTreeNode[] = [
        {
          ...sampleTodo,
          children: [
            { ...sampleTodo, id: "t2", title: "Child Todo", children: [] },
          ],
        },
      ];
      mockApiClient.getTodoTree.mockResolvedValue(tree);

      const result = await mcpClient.callTool({
        name: "todos_tree",
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Sample Todo");
      expect(textContent.text).toContain("Child Todo");
      expect(textContent.text).toContain("tree");
    });

    it("returns empty tree when no todos exist", async () => {
      mockApiClient.getTodoTree.mockResolvedValue([]);

      const result = await mcpClient.callTool({
        name: "todos_tree",
        arguments: {},
      });

      const textContent = getTextContent(result);
      expect(textContent.text).toContain("[]");
    });

    it("calls getTodoTree on ApiClient", async () => {
      mockApiClient.getTodoTree.mockResolvedValue([]);

      await mcpClient.callTool({
        name: "todos_tree",
        arguments: {},
      });

      expect(mockApiClient.getTodoTree).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("returns isError: true when API throws an error on list", async () => {
      mockApiClient.listTodos.mockRejectedValue(new Error("API error: 500 Internal Server Error"));

      const result = await mcpClient.callTool({
        name: "todos_list",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("500");
    });

    it("returns isError: true when API throws on create", async () => {
      mockApiClient.createTodo.mockRejectedValue(new Error("API error: 401 Unauthorized"));

      const result = await mcpClient.callTool({
        name: "todos_create",
        arguments: { title: "Test" },
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("401");
    });

    it("returns isError: true when API throws on delete", async () => {
      mockApiClient.deleteTodo.mockRejectedValue(new Error("Not Found"));

      const result = await mcpClient.callTool({
        name: "todos_delete",
        arguments: { id: "nonexistent" },
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Not Found");
    });

    it("returns isError: true when API throws on toggle", async () => {
      mockApiClient.toggleComplete.mockRejectedValue(new Error("Network timeout"));

      const result = await mcpClient.callTool({
        name: "todos_toggle_complete",
        arguments: { id: "t1" },
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Network timeout");
    });

    it("returns isError: true when API throws on update", async () => {
      mockApiClient.updateTodo.mockRejectedValue(new Error("API error: 422 Validation failed"));

      const result = await mcpClient.callTool({
        name: "todos_update",
        arguments: { id: "t1", title: "bad" },
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("422");
    });

    it("returns isError: true when API throws on tree", async () => {
      mockApiClient.getTodoTree.mockRejectedValue(new Error("Service unavailable"));

      const result = await mcpClient.callTool({
        name: "todos_tree",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("Service unavailable");
    });

    it("handles non-Error thrown values gracefully", async () => {
      mockApiClient.listTodos.mockRejectedValue("string error");

      const result = await mcpClient.callTool({
        name: "todos_list",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("string error");
    });
  });

  // =========================================================================
  // Unknown tool
  // =========================================================================

  describe("unknown tool", () => {
    it("returns isError: true when calling a non-existent tool", async () => {
      const result = await mcpClient.callTool({
        name: "nonexistent_tool",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const textContent = getTextContent(result);
      expect(textContent.text).toContain("not found");
    });
  });
});
