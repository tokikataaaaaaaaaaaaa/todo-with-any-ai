import { create } from 'zustand'
import type { Sprint, CreateSprint } from '@todo-with-any-ai/shared'
import { apiClient } from '@/lib/api-client'

interface SprintState {
  sprints: Sprint[]
  loading: boolean
  error: string | null
  fetchSprints: () => Promise<void>
  createSprint: (data: CreateSprint) => Promise<void>
  deleteSprint: (id: string) => Promise<void>
  addTodoToSprint: (sprintId: string, todoId: string) => Promise<void>
  removeTodoFromSprint: (sprintId: string, todoId: string) => Promise<void>
  reset: () => void
}

export const useSprintStore = create<SprintState>((set, get) => ({
  sprints: [],
  loading: false,
  error: null,

  fetchSprints: async () => {
    set({ loading: true, error: null })
    try {
      const sprints = await apiClient.listSprints()
      set({ sprints, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createSprint: async (data: CreateSprint) => {
    const prevSprints = get().sprints
    const tempId = `temp-${Date.now()}`
    const tempSprint: Sprint = {
      ...data,
      id: tempId,
      todoIds: data.todoIds ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ sprints: [...prevSprints, tempSprint], error: null })

    try {
      const serverSprint = await apiClient.createSprint(data)
      set({
        sprints: get().sprints.map((s) => (s.id === tempId ? serverSprint : s)),
      })
    } catch (e) {
      set({ sprints: prevSprints, error: (e as Error).message })
    }
  },

  deleteSprint: async (id: string) => {
    const prevSprints = get().sprints
    set({ sprints: prevSprints.filter((s) => s.id !== id), error: null })

    try {
      await apiClient.deleteSprint(id)
    } catch (e) {
      set({ sprints: prevSprints, error: (e as Error).message })
    }
  },

  addTodoToSprint: async (sprintId: string, todoId: string) => {
    const prevSprints = get().sprints
    set({
      sprints: prevSprints.map((s) =>
        s.id === sprintId
          ? { ...s, todoIds: s.todoIds.includes(todoId) ? s.todoIds : [...s.todoIds, todoId] }
          : s
      ),
      error: null,
    })

    try {
      const serverSprint = await apiClient.addTodoToSprint(sprintId, todoId)
      set({
        sprints: get().sprints.map((s) => (s.id === sprintId ? serverSprint : s)),
      })
    } catch (e) {
      set({ sprints: prevSprints, error: (e as Error).message })
    }
  },

  removeTodoFromSprint: async (sprintId: string, todoId: string) => {
    const prevSprints = get().sprints
    set({
      sprints: prevSprints.map((s) =>
        s.id === sprintId
          ? { ...s, todoIds: s.todoIds.filter((id) => id !== todoId) }
          : s
      ),
      error: null,
    })

    try {
      const serverSprint = await apiClient.removeTodoFromSprint(sprintId, todoId)
      set({
        sprints: get().sprints.map((s) => (s.id === sprintId ? serverSprint : s)),
      })
    } catch (e) {
      set({ sprints: prevSprints, error: (e as Error).message })
    }
  },

  reset: () => {
    set({
      sprints: [],
      loading: false,
      error: null,
    })
  },
}))
