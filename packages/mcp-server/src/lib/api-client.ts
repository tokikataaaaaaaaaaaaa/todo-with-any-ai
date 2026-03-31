import { Config } from "./config.js";
import type { Todo, TodoTreeNode, Project, Sprint } from "./types.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: Pick<Config, "apiKey" | "apiUrl">) {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey ?? "";
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = (errorBody as Record<string, string>).message || response.statusText;

      if (response.status === 401) {
        throw new ApiError(401, "Unauthorized", `Authentication failed: ${message}`);
      }
      if (response.status === 404) {
        throw new ApiError(404, "Not Found", `Not found: ${message}`);
      }
      if (response.status === 429) {
        throw new ApiError(429, "Too Many Requests", `Rate limit exceeded: ${message}`);
      }
      throw new ApiError(response.status, response.statusText, `API error: ${response.status} ${message}`);
    }

    return response.json() as Promise<T>;
  }

  async listTodos(filters?: {
    completed?: boolean;
    parentId?: string | null;
    sort?: 'order' | 'dueDate';
    dueBefore?: string;
  }): Promise<Todo[]> {
    const params = new URLSearchParams();
    if (filters?.completed !== undefined) {
      params.set("completed", String(filters.completed));
    }
    if (filters?.parentId !== undefined) {
      params.set("parentId", String(filters.parentId));
    }
    if (filters?.sort !== undefined) {
      params.set("sort", filters.sort);
    }
    if (filters?.dueBefore !== undefined) {
      params.set("dueBefore", filters.dueBefore);
    }
    const query = params.toString();
    const path = query ? `/todos?${query}` : "/todos";
    return this.request<Todo[]>(path);
  }

  async getTodoTree(): Promise<TodoTreeNode[]> {
    return this.request<TodoTreeNode[]>("/todos/tree");
  }

  async getTodo(id: string): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}`);
  }

  async createTodo(data: {
    title: string;
    projectId?: string;
    parentId?: string;
    dueDate?: string;
    startTime?: string;
    endTime?: string;
    priority?: string;
    categoryIcon?: string;
    description?: string;
  }): Promise<Todo> {
    return this.request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTodo(id: string, data: Record<string, unknown>): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTodo(id: string): Promise<{ deletedCount: number }> {
    return this.request<{ deletedCount: number }>(`/todos/${id}`, {
      method: "DELETE",
    });
  }

  async toggleComplete(id: string): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}/toggle`, {
      method: "POST",
    });
  }

  // Project methods

  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>("/projects");
  }

  async createProject(data: {
    name: string;
    color?: string;
    emoji?: string;
    dueDate?: string;
  }): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Record<string, unknown>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string, deleteTodos?: boolean): Promise<{ message: string }> {
    const params = new URLSearchParams();
    if (deleteTodos !== undefined) {
      params.set("deleteTodos", String(deleteTodos));
    }
    const query = params.toString();
    const path = query ? `/projects/${id}?${query}` : `/projects/${id}`;
    return this.request<{ message: string }>(path, {
      method: "DELETE",
    });
  }

  // Sprint methods

  async listSprints(): Promise<Sprint[]> {
    return this.request<Sprint[]>("/sprints");
  }

  async createSprint(data: {
    name: string;
    startDate: string;
    endDate: string;
    todoIds?: string[];
  }): Promise<Sprint> {
    return this.request<Sprint>("/sprints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addTodoToSprint(sprintId: string, todoId: string): Promise<Sprint> {
    return this.request<Sprint>(`/sprints/${sprintId}/todos/${todoId}`, {
      method: "POST",
    });
  }
}
