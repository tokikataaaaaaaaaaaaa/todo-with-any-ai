import { create } from 'zustand'
import type { Todo, CreateTodo, UpdateTodo } from '@todo-with-any-ai/shared'
import { apiClient } from '@/lib/api-client'
import { useSnackbarStore } from '@/stores/snackbar-store'

interface TodoState {
  todos: Todo[]
  loading: boolean
  error: string | null
  expandedIds: Set<string>
  fetchTodos: (filters?: { sort?: string }) => Promise<void>
  createTodo: (data: CreateTodo) => Promise<void>
  updateTodo: (id: string, data: UpdateTodo) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  toggleExpand: (id: string) => void
  reset: () => void
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  expandedIds: new Set<string>(),

  fetchTodos: async (filters?: { sort?: string }) => {
    set({ loading: true, error: null })
    try {
      const todos = await apiClient.listTodos(filters)
      set({ todos, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createTodo: async (data: CreateTodo) => {
    const prevTodos = get().todos
    // Optimistic: add a temporary todo
    const tempId = `temp-${Date.now()}`
    const tempTodo: Todo = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ todos: [...prevTodos, tempTodo], error: null })

    try {
      const serverTodo = await apiClient.createTodo(data)
      // Replace temp with server response
      set({
        todos: get().todos.map((t) => (t.id === tempId ? serverTodo : t)),
      })
      useSnackbarStore.getState().addMessage('success', 'Todoを作成しました')
    } catch (e) {
      // Rollback
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  updateTodo: async (id: string, data: UpdateTodo) => {
    const prevTodos = get().todos
    // Optimistic update
    set({
      todos: prevTodos.map((t) => (t.id === id ? { ...t, ...data } : t)),
      error: null,
    })

    try {
      const serverTodo = await apiClient.updateTodo(id, data)
      set({
        todos: get().todos.map((t) => (t.id === id ? serverTodo : t)),
      })
    } catch (e) {
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  deleteTodo: async (id: string) => {
    const prevTodos = get().todos
    // Optimistic remove
    set({ todos: prevTodos.filter((t) => t.id !== id), error: null })

    try {
      await apiClient.deleteTodo(id)
      useSnackbarStore.getState().addMessage('success', 'Todoを削除しました')
    } catch (e) {
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  toggleComplete: async (id: string) => {
    const prevTodos = get().todos
    // Optimistic toggle
    set({
      todos: prevTodos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
      error: null,
    })

    try {
      const serverTodo = await apiClient.toggleComplete(id)
      set({
        todos: get().todos.map((t) => (t.id === id ? serverTodo : t)),
      })
    } catch (e) {
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  toggleExpand: (id: string) => {
    const expandedIds = new Set(get().expandedIds)
    if (expandedIds.has(id)) {
      expandedIds.delete(id)
    } else {
      expandedIds.add(id)
    }
    set({ expandedIds })
  },

  reset: () => {
    set({
      todos: [],
      loading: false,
      error: null,
      expandedIds: new Set<string>(),
    })
  },
}))
