import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApiClient } from "../lib/api-client.js";
import { handleToolCall } from "../tools/index.js";

interface Project {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  order: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function createMockClient() {
  return {
    // Existing todo methods
    listTodos: vi.fn(),
    getTodoTree: vi.fn(),
    getTodo: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    toggleComplete: vi.fn(),
    // Project methods
    listProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  };
}

const sampleProject: Project = {
  id: "proj-1",
  name: "Sample Project",
  color: "#FF5733",
  emoji: null,
  order: 0,
  dueDate: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("handleToolCall - projects", () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  describe("projects_list", () => {
    it("calls listProjects and returns project list", async () => {
      client.listProjects.mockResolvedValue([sampleProject]);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_list",
        {}
      );

      expect(client.listProjects).toHaveBeenCalled();
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Sample Project");
    });

    it("returns count of 0 when no projects found", async () => {
      client.listProjects.mockResolvedValue([]);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_list",
        {}
      );

      expect(result.content[0].text).toContain('"count": 0');
    });

    it("returns count matching number of projects", async () => {
      client.listProjects.mockResolvedValue([
        sampleProject,
        { ...sampleProject, id: "proj-2" },
      ]);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_list",
        {}
      );

      expect(result.content[0].text).toContain('"count": 2');
    });
  });

  describe("projects_create", () => {
    it("calls createProject and returns created project", async () => {
      client.createProject.mockResolvedValue({
        ...sampleProject,
        name: "New Project",
      });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_create",
        { name: "New Project", color: "#123456" }
      );

      expect(client.createProject).toHaveBeenCalledWith({
        name: "New Project",
        color: "#123456",
      });
      expect(result.content[0].text).toContain("New Project");
    });

    it("passes optional fields (emoji, dueDate)", async () => {
      client.createProject.mockResolvedValue(sampleProject);

      await handleToolCall(client as unknown as ApiClient, "projects_create", {
        name: "Full Project",
        color: "#AABBCC",
        emoji: "\u{1F4BC}",
        dueDate: "2026-06-15",
      });

      expect(client.createProject).toHaveBeenCalledWith({
        name: "Full Project",
        color: "#AABBCC",
        emoji: "\u{1F4BC}",
        dueDate: "2026-06-15",
      });
    });

    it("returns error when name is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_create",
        { color: "#123456" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("name");
    });

    it("returns error when name is empty string", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_create",
        { name: "", color: "#123456" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("name");
    });

    it("returns error when name exceeds 50 characters", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_create",
        { name: "a".repeat(51), color: "#123456" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("50");
    });
  });

  describe("projects_update", () => {
    it("calls updateProject and returns updated project", async () => {
      client.updateProject.mockResolvedValue({
        ...sampleProject,
        name: "Updated",
      });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_update",
        { id: "proj-1", name: "Updated" }
      );

      expect(client.updateProject).toHaveBeenCalledWith("proj-1", {
        name: "Updated",
      });
      expect(result.content[0].text).toContain("Updated");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_update",
        { name: "No id" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });

    it("passes multiple update fields excluding id", async () => {
      client.updateProject.mockResolvedValue(sampleProject);

      await handleToolCall(client as unknown as ApiClient, "projects_update", {
        id: "proj-1",
        name: "New Name",
        color: "#000000",
        emoji: "\u{2B50}",
      });

      expect(client.updateProject).toHaveBeenCalledWith("proj-1", {
        name: "New Name",
        color: "#000000",
        emoji: "\u{2B50}",
      });
    });
  });

  describe("projects_delete", () => {
    it("calls deleteProject and returns success message", async () => {
      client.deleteProject.mockResolvedValue({ message: "Project deleted" });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_delete",
        { id: "proj-1" }
      );

      expect(client.deleteProject).toHaveBeenCalledWith("proj-1", false);
      expect(result.content[0].text).toContain("deleted");
    });

    it("passes deleteTodos=true to deleteProject", async () => {
      client.deleteProject.mockResolvedValue({ message: "Project deleted" });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_delete",
        { id: "proj-1", deleteTodos: true }
      );

      expect(client.deleteProject).toHaveBeenCalledWith("proj-1", true);
      expect(result.content[0].text).toContain("deleted");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_delete",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });
  });

  describe("API error handling for projects", () => {
    it("returns isError=true when listProjects throws", async () => {
      client.listProjects.mockRejectedValue(
        new Error("API error: 500 Internal Server Error")
      );

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_list",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("500");
    });

    it("returns isError=true when createProject throws 401", async () => {
      client.createProject.mockRejectedValue(
        new Error("API error: 401 Unauthorized")
      );

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_create",
        { name: "Test", color: "#123456" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("401");
    });

    it("returns isError=true when deleteProject throws 404", async () => {
      client.deleteProject.mockRejectedValue(
        new Error("API error: 404 Not Found")
      );

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "projects_delete",
        { id: "nonexistent" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("404");
    });
  });
});
