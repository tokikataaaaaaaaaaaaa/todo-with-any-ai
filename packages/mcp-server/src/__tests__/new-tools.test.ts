import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApiClient } from "../lib/api-client.js";
import { handleToolCall } from "../tools/index.js";
import type { Todo, Sprint } from "../lib/types.js";

interface UrgencyLevel {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

function createMockClient() {
  return {
    // Todo methods
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
    // Sprint methods
    listSprints: vi.fn(),
    getSprint: vi.fn(),
    createSprint: vi.fn(),
    updateSprint: vi.fn(),
    deleteSprint: vi.fn(),
    addTodoToSprint: vi.fn(),
    removeTodoFromSprint: vi.fn(),
    // Urgency level methods
    listUrgencyLevels: vi.fn(),
    createUrgencyLevel: vi.fn(),
    updateUrgencyLevel: vi.fn(),
    deleteUrgencyLevel: vi.fn(),
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

const sampleSprint: Sprint = {
  id: "sp-1",
  name: "Sprint 1",
  startDate: "2026-04-01",
  endDate: "2026-04-14",
  todoIds: ["t1"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const sampleUrgencyLevel: UrgencyLevel = {
  id: "ul-1",
  name: "Urgent",
  color: "#FF0000",
  icon: "fire",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("handleToolCall - new tools", () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  // ===== todos_get =====
  describe("todos_get", () => {
    it("calls getTodo with id and returns todo", async () => {
      client.getTodo.mockResolvedValue(sampleTodo);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_get",
        { id: "t1" }
      );

      expect(client.getTodo).toHaveBeenCalledWith("t1");
      expect(result.content[0].text).toContain("Sample Todo");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_get",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });
  });

  // ===== todos_list with projectId =====
  describe("todos_list with projectId", () => {
    it("calls listTodos with projectId filter", async () => {
      client.listTodos.mockResolvedValue([sampleTodo]);

      await handleToolCall(client as unknown as ApiClient, "todos_list", {
        projectId: "proj-1",
      });

      expect(client.listTodos).toHaveBeenCalledWith({ projectId: "proj-1" });
    });
  });

  // ===== todos_create with urgencyLevelId =====
  describe("todos_create with urgencyLevelId", () => {
    it("passes urgencyLevelId to createTodo", async () => {
      client.createTodo.mockResolvedValue(sampleTodo);

      await handleToolCall(client as unknown as ApiClient, "todos_create", {
        title: "Urgent Task",
        urgencyLevelId: "ul-1",
      });

      expect(client.createTodo).toHaveBeenCalledWith({
        title: "Urgent Task",
        urgencyLevelId: "ul-1",
      });
    });
  });

  // ===== todos_update with urgencyLevelId =====
  describe("todos_update with urgencyLevelId", () => {
    it("passes urgencyLevelId in update", async () => {
      client.updateTodo.mockResolvedValue(sampleTodo);

      await handleToolCall(client as unknown as ApiClient, "todos_update", {
        id: "t1",
        urgencyLevelId: "ul-2",
      });

      expect(client.updateTodo).toHaveBeenCalledWith("t1", {
        urgencyLevelId: "ul-2",
      });
    });
  });

  // ===== todos_move =====
  describe("todos_move", () => {
    it("calls updateTodo with parentId and order for child position", async () => {
      client.updateTodo.mockResolvedValue(sampleTodo);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_move",
        { todoId: "t1", targetId: "t2", position: "child" }
      );

      expect(client.updateTodo).toHaveBeenCalledWith("t1", {
        parentId: "t2",
        order: 0,
      });
      expect(result.content[0].text).toContain("moved");
    });

    it("calls updateTodo with sibling position for before", async () => {
      client.getTodo.mockResolvedValue({ ...sampleTodo, id: "t2", parentId: "p1" });
      client.updateTodo.mockResolvedValue(sampleTodo);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_move",
        { todoId: "t1", targetId: "t2", position: "before" }
      );

      expect(client.getTodo).toHaveBeenCalledWith("t2");
      expect(client.updateTodo).toHaveBeenCalledWith("t1", {
        parentId: "p1",
        position: "before",
        referenceId: "t2",
      });
    });

    it("calls updateTodo with sibling position for after", async () => {
      client.getTodo.mockResolvedValue({ ...sampleTodo, id: "t2", parentId: null });
      client.updateTodo.mockResolvedValue(sampleTodo);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_move",
        { todoId: "t1", targetId: "t2", position: "after" }
      );

      expect(client.getTodo).toHaveBeenCalledWith("t2");
      expect(client.updateTodo).toHaveBeenCalledWith("t1", {
        parentId: null,
        position: "after",
        referenceId: "t2",
      });
    });

    it("returns error when todoId is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_move",
        { targetId: "t2", position: "child" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("todoId");
    });

    it("returns error when targetId is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_move",
        { todoId: "t1", position: "child" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("targetId");
    });

    it("returns error when position is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "todos_move",
        { todoId: "t1", targetId: "t2" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("position");
    });
  });

  // ===== sprints_get =====
  describe("sprints_get", () => {
    it("calls getSprint with id and returns sprint", async () => {
      client.getSprint.mockResolvedValue(sampleSprint);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_get",
        { id: "sp-1" }
      );

      expect(client.getSprint).toHaveBeenCalledWith("sp-1");
      expect(result.content[0].text).toContain("Sprint 1");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_get",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });
  });

  // ===== sprints_update =====
  describe("sprints_update", () => {
    it("calls updateSprint with id and data", async () => {
      client.updateSprint.mockResolvedValue({
        ...sampleSprint,
        name: "Updated Sprint",
      });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_update",
        { id: "sp-1", name: "Updated Sprint" }
      );

      expect(client.updateSprint).toHaveBeenCalledWith("sp-1", {
        name: "Updated Sprint",
      });
      expect(result.content[0].text).toContain("Updated Sprint");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_update",
        { name: "No id" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });

    it("passes multiple update fields excluding id", async () => {
      client.updateSprint.mockResolvedValue(sampleSprint);

      await handleToolCall(client as unknown as ApiClient, "sprints_update", {
        id: "sp-1",
        name: "New Name",
        startDate: "2026-05-01",
        endDate: "2026-05-14",
      });

      expect(client.updateSprint).toHaveBeenCalledWith("sp-1", {
        name: "New Name",
        startDate: "2026-05-01",
        endDate: "2026-05-14",
      });
    });
  });

  // ===== sprints_delete =====
  describe("sprints_delete", () => {
    it("calls deleteSprint with id", async () => {
      client.deleteSprint.mockResolvedValue({ message: "Sprint deleted" });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_delete",
        { id: "sp-1" }
      );

      expect(client.deleteSprint).toHaveBeenCalledWith("sp-1");
      expect(result.content[0].text).toContain("deleted");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_delete",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });
  });

  // ===== sprints_remove_todo =====
  describe("sprints_remove_todo", () => {
    it("calls removeTodoFromSprint with sprintId and todoId", async () => {
      client.removeTodoFromSprint.mockResolvedValue(sampleSprint);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_remove_todo",
        { sprintId: "sp-1", todoId: "t1" }
      );

      expect(client.removeTodoFromSprint).toHaveBeenCalledWith("sp-1", "t1");
      expect(result.content[0].text).toContain("removed");
    });

    it("returns error when sprintId is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_remove_todo",
        { todoId: "t1" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("sprintId");
    });

    it("returns error when todoId is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "sprints_remove_todo",
        { sprintId: "sp-1" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("todoId");
    });
  });

  // ===== urgency_levels_list =====
  describe("urgency_levels_list", () => {
    it("calls listUrgencyLevels and returns list", async () => {
      client.listUrgencyLevels.mockResolvedValue([sampleUrgencyLevel]);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_list",
        {}
      );

      expect(client.listUrgencyLevels).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Urgent");
    });

    it("returns count of 0 when no urgency levels found", async () => {
      client.listUrgencyLevels.mockResolvedValue([]);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_list",
        {}
      );

      expect(result.content[0].text).toContain('"count": 0');
    });
  });

  // ===== urgency_levels_create =====
  describe("urgency_levels_create", () => {
    it("calls createUrgencyLevel and returns created level", async () => {
      client.createUrgencyLevel.mockResolvedValue(sampleUrgencyLevel);

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_create",
        { name: "Urgent", color: "#FF0000", icon: "fire" }
      );

      expect(client.createUrgencyLevel).toHaveBeenCalledWith({
        name: "Urgent",
        color: "#FF0000",
        icon: "fire",
      });
      expect(result.content[0].text).toContain("Urgent");
    });

    it("returns error when name is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_create",
        { color: "#FF0000", icon: "fire" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("name");
    });

    it("returns error when color is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_create",
        { name: "Urgent", icon: "fire" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("color");
    });

    it("returns error when icon is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_create",
        { name: "Urgent", color: "#FF0000" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("icon");
    });
  });

  // ===== urgency_levels_update =====
  describe("urgency_levels_update", () => {
    it("calls updateUrgencyLevel with id and data", async () => {
      client.updateUrgencyLevel.mockResolvedValue({
        ...sampleUrgencyLevel,
        name: "Critical",
      });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_update",
        { id: "ul-1", name: "Critical" }
      );

      expect(client.updateUrgencyLevel).toHaveBeenCalledWith("ul-1", {
        name: "Critical",
      });
      expect(result.content[0].text).toContain("Critical");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_update",
        { name: "No id" }
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });
  });

  // ===== urgency_levels_delete =====
  describe("urgency_levels_delete", () => {
    it("calls deleteUrgencyLevel with id", async () => {
      client.deleteUrgencyLevel.mockResolvedValue({ message: "Deleted" });

      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_delete",
        { id: "ul-1" }
      );

      expect(client.deleteUrgencyLevel).toHaveBeenCalledWith("ul-1");
      expect(result.content[0].text).toContain("deleted");
    });

    it("returns error when id is missing", async () => {
      const result = await handleToolCall(
        client as unknown as ApiClient,
        "urgency_levels_delete",
        {}
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("id");
    });
  });
});
