import type { Todo, TodoTreeNode, CreateTodo, UpdateTodo, Project, CreateProject, UpdateProject, UrgencyLevel, CreateUrgencyLevel, UpdateUrgencyLevel, Sprint, CreateSprint, UpdateSprint } from '@todo-with-any-ai/shared'
import { auth } from './firebase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  if (!response.ok) {
    let message: string
    try {
      const body = await response.json()
      message = body.message || response.statusText
    } catch {
      message = response.statusText
    }
    throw new Error(message)
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  return response.json()
}

export const apiClient = {
  async listTodos(filters?: { completed?: boolean; parentId?: string | null; sort?: string }): Promise<Todo[]> {
    const params = new URLSearchParams()
    if (filters) {
      if (filters.completed !== undefined) {
        params.set('completed', String(filters.completed))
      }
      if (filters.parentId !== undefined) {
        params.set('parentId', String(filters.parentId))
      }
      if (filters.sort !== undefined) {
        params.set('sort', filters.sort)
      }
    }
    const query = params.toString()
    return request<Todo[]>(`/todos${query ? `?${query}` : ''}`, { method: 'GET' })
  },

  async getTodoTree(): Promise<TodoTreeNode[]> {
    return request<TodoTreeNode[]>('/todos/tree', { method: 'GET' })
  },

  async getTodo(id: string): Promise<Todo> {
    return request<Todo>(`/todos/${id}`, { method: 'GET' })
  },

  async createTodo(data: CreateTodo): Promise<Todo> {
    console.log('[API] createTodo body:', JSON.stringify(data))
    return request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateTodo(id: string, data: UpdateTodo): Promise<Todo> {
    return request<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteTodo(id: string): Promise<void> {
    return request<void>(`/todos/${id}`, { method: 'DELETE' })
  },

  async toggleComplete(id: string): Promise<Todo> {
    return request<Todo>(`/todos/${id}/toggle`, { method: 'POST' })
  },

  async listProjects(): Promise<Project[]> {
    return request<Project[]>('/projects', { method: 'GET' })
  },

  async createProject(data: CreateProject): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateProject(id: string, data: UpdateProject): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteProject(id: string, deleteTodos?: boolean): Promise<void> {
    const query = deleteTodos ? '?deleteTodos=true' : ''
    return request<void>(`/projects/${id}${query}`, { method: 'DELETE' })
  },

  async listUrgencyLevels(): Promise<UrgencyLevel[]> {
    return request<UrgencyLevel[]>('/urgency-levels', { method: 'GET' })
  },

  async createUrgencyLevel(data: CreateUrgencyLevel): Promise<UrgencyLevel> {
    return request<UrgencyLevel>('/urgency-levels', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateUrgencyLevel(id: string, data: UpdateUrgencyLevel): Promise<UrgencyLevel> {
    return request<UrgencyLevel>(`/urgency-levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteUrgencyLevel(id: string): Promise<void> {
    return request<void>(`/urgency-levels/${id}`, { method: 'DELETE' })
  },

  // Sprint methods
  async listSprints(): Promise<Sprint[]> {
    return request<Sprint[]>('/sprints', { method: 'GET' })
  },

  async createSprint(data: CreateSprint): Promise<Sprint> {
    return request<Sprint>('/sprints', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getSprint(id: string): Promise<Sprint> {
    return request<Sprint>(`/sprints/${id}`, { method: 'GET' })
  },

  async updateSprint(id: string, data: UpdateSprint): Promise<Sprint> {
    return request<Sprint>(`/sprints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteSprint(id: string): Promise<void> {
    return request<void>(`/sprints/${id}`, { method: 'DELETE' })
  },

  async addTodoToSprint(sprintId: string, todoId: string): Promise<Sprint> {
    return request<Sprint>(`/sprints/${sprintId}/todos/${todoId}`, { method: 'POST' })
  },

  async removeTodoFromSprint(sprintId: string, todoId: string): Promise<Sprint> {
    return request<Sprint>(`/sprints/${sprintId}/todos/${todoId}`, { method: 'DELETE' })
  },
}
