import type { Todo, TodoTreeNode, CreateTodo, UpdateTodo } from '@todo-with-any-ai/shared'
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

  return response.json()
}

export const apiClient = {
  async listTodos(filters?: { completed?: boolean; parentId?: string | null }): Promise<Todo[]> {
    const params = new URLSearchParams()
    if (filters) {
      if (filters.completed !== undefined) {
        params.set('completed', String(filters.completed))
      }
      if (filters.parentId !== undefined) {
        params.set('parentId', String(filters.parentId))
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
}
