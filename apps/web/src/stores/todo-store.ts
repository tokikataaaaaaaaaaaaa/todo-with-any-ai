import { create } from 'zustand'
import type { Todo } from '@todo-with-any-ai/shared'

interface TodoState {
  todos: Todo[]
  loading: boolean
  error: string | null
  setTodos: (todos: Todo[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,
  error: null,
  setTodos: (todos) => set({ todos }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
