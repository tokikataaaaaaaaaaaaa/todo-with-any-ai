import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient } from "../lib/api-client.js";

const BASE_URL = "http://localhost:5001/api";
const API_KEY = "test-api-key-123";

function createClient(): ApiClient {
  return new ApiClient({ apiKey: API_KEY, apiUrl: BASE_URL });
}

function mockFetch(body: unknown, status = 200, statusText = "OK") {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
  });
}

describe("ApiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("listTodos", () => {
    it("calls GET /todos with correct URL and auth header", async () => {
      const todos = [{ id: "1", title: "Test", completed: false }];
      globalThis.fetch = mockFetch(todos);

      const client = createClient();
      const result = await client.listTodos();

      expect(globalThis.fetch).toHaveBeenCalledOnce();
      const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos`);
      expect(options.method).toBeUndefined(); // GET is default
      expect(options.headers["Authorization"]).toBe(`Bearer ${API_KEY}`);
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(result).toEqual(todos);
    });

    it("passes completed=false as query parameter", async () => {
      globalThis.fetch = mockFetch([]);
      const client = createClient();
      await client.listTodos({ completed: false });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos?completed=false`);
    });

    it("passes completed=true as query parameter", async () => {
      globalThis.fetch = mockFetch([]);
      const client = createClient();
      await client.listTodos({ completed: true });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos?completed=true`);
    });

    it("passes parentId as query parameter", async () => {
      globalThis.fetch = mockFetch([]);
      const client = createClient();
      await client.listTodos({ parentId: "abc123" });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos?parentId=abc123`);
    });

    it("passes parentId=null as query parameter for root todos", async () => {
      globalThis.fetch = mockFetch([]);
      const client = createClient();
      await client.listTodos({ parentId: "null" });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos?parentId=null`);
    });

    it("passes both completed and parentId as query parameters", async () => {
      globalThis.fetch = mockFetch([]);
      const client = createClient();
      await client.listTodos({ completed: false, parentId: "null" });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("completed=false");
      expect(url).toContain("parentId=null");
    });
  });

  describe("getTodoTree", () => {
    it("calls GET /todos/tree", async () => {
      const tree = [{ id: "1", title: "Root", children: [] }];
      globalThis.fetch = mockFetch(tree);

      const client = createClient();
      const result = await client.getTodoTree();

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos/tree`);
      expect(result).toEqual(tree);
    });
  });

  describe("getTodo", () => {
    it("calls GET /todos/:id", async () => {
      const todo = { id: "abc", title: "Single Todo" };
      globalThis.fetch = mockFetch(todo);

      const client = createClient();
      const result = await client.getTodo("abc");

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos/abc`);
      expect(result).toEqual(todo);
    });
  });

  describe("createTodo", () => {
    it("calls POST /todos with correct body", async () => {
      const newTodo = { id: "new1", title: "New Todo" };
      globalThis.fetch = mockFetch(newTodo, 201);

      const client = createClient();
      const result = await client.createTodo({ title: "New Todo" });

      const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos`);
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ title: "New Todo" });
      expect(result).toEqual(newTodo);
    });

    it("includes optional fields in request body", async () => {
      globalThis.fetch = mockFetch({ id: "new2" }, 201);

      const client = createClient();
      await client.createTodo({
        title: "With Options",
        parentId: "parent1",
        dueDate: "2026-04-01",
        priority: "high",
        categoryIcon: "work",
      });

      const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.title).toBe("With Options");
      expect(body.parentId).toBe("parent1");
      expect(body.dueDate).toBe("2026-04-01");
      expect(body.priority).toBe("high");
      expect(body.categoryIcon).toBe("work");
    });
  });

  describe("updateTodo", () => {
    it("calls PATCH /todos/:id with partial update body", async () => {
      const updated = { id: "u1", title: "Updated" };
      globalThis.fetch = mockFetch(updated);

      const client = createClient();
      const result = await client.updateTodo("u1", { title: "Updated" });

      const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos/u1`);
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ title: "Updated" });
      expect(result).toEqual(updated);
    });
  });

  describe("deleteTodo", () => {
    it("calls DELETE /todos/:id", async () => {
      globalThis.fetch = mockFetch({ deletedCount: 3 });

      const client = createClient();
      const result = await client.deleteTodo("d1");

      const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos/d1`);
      expect(options.method).toBe("DELETE");
      expect(result).toEqual({ deletedCount: 3 });
    });
  });

  describe("toggleComplete", () => {
    it("calls POST /todos/:id/toggle", async () => {
      const toggled = { id: "t1", completed: true };
      globalThis.fetch = mockFetch(toggled);

      const client = createClient();
      const result = await client.toggleComplete("t1");

      const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/todos/t1/toggle`);
      expect(options.method).toBe("POST");
      expect(result).toEqual(toggled);
    });
  });

  describe("error handling", () => {
    it("throws ApiError with message on 401 Unauthorized", async () => {
      globalThis.fetch = mockFetch({ message: "Invalid API key" }, 401, "Unauthorized");

      const client = createClient();
      await expect(client.listTodos()).rejects.toThrow(/401.*Unauthorized|authentication/i);
    });

    it("throws ApiError with message on 404 Not Found", async () => {
      globalThis.fetch = mockFetch({ message: "Todo not found" }, 404, "Not Found");

      const client = createClient();
      await expect(client.getTodo("nonexistent")).rejects.toThrow(/404.*Not Found|not found/i);
    });

    it("throws ApiError with rate limit message on 429", async () => {
      globalThis.fetch = mockFetch({ message: "Too many requests" }, 429, "Too Many Requests");

      const client = createClient();
      await expect(client.listTodos()).rejects.toThrow(/429|rate limit|too many/i);
    });

    it("throws ApiError on 500 Internal Server Error", async () => {
      globalThis.fetch = mockFetch({ message: "Internal error" }, 500, "Internal Server Error");

      const client = createClient();
      await expect(client.listTodos()).rejects.toThrow(/500/);
    });

    it("throws on network error (fetch rejects)", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

      const client = createClient();
      await expect(client.listTodos()).rejects.toThrow(/fetch failed|network/i);
    });
  });
});
