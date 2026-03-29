import { create } from 'zustand'
import type { UrgencyLevel, CreateUrgencyLevel, UpdateUrgencyLevel } from '@todo-with-any-ai/shared'
import { apiClient } from '@/lib/api-client'

interface UrgencyLevelState {
  levels: UrgencyLevel[]
  loading: boolean
  error: string | null
  fetchLevels: () => Promise<void>
  createLevel: (data: CreateUrgencyLevel) => Promise<void>
  updateLevel: (id: string, data: UpdateUrgencyLevel) => Promise<void>
  deleteLevel: (id: string) => Promise<void>
  reset: () => void
}

export const useUrgencyLevelStore = create<UrgencyLevelState>((set, get) => ({
  levels: [],
  loading: false,
  error: null,

  fetchLevels: async () => {
    set({ loading: true, error: null })
    try {
      const levels = await apiClient.listUrgencyLevels()
      set({ levels, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createLevel: async (data: CreateUrgencyLevel) => {
    try {
      const newLevel = await apiClient.createUrgencyLevel(data)
      set({ levels: [...get().levels, newLevel], error: null })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  updateLevel: async (id: string, data: UpdateUrgencyLevel) => {
    const prevLevels = get().levels
    // Optimistic update
    set({
      levels: prevLevels.map((l) => (l.id === id ? { ...l, ...data } : l)),
      error: null,
    })
    try {
      const updated = await apiClient.updateUrgencyLevel(id, data)
      set({
        levels: get().levels.map((l) => (l.id === id ? updated : l)),
      })
    } catch (e) {
      set({ levels: prevLevels, error: (e as Error).message })
    }
  },

  deleteLevel: async (id: string) => {
    const prevLevels = get().levels
    // Optimistic remove
    set({ levels: prevLevels.filter((l) => l.id !== id), error: null })
    try {
      await apiClient.deleteUrgencyLevel(id)
    } catch (e) {
      set({ levels: prevLevels, error: (e as Error).message })
    }
  },

  reset: () => {
    set({ levels: [], loading: false, error: null })
  },
}))
