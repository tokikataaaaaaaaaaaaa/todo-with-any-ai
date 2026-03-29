import { create } from 'zustand'
import { apiKeysClient } from '@/lib/api-keys-client'
import type { ApiKey } from '@todo-with-any-ai/shared'

interface ApiKeyState {
  keys: ApiKey[]
  loading: boolean
  error: string | null
  fetchKeys: () => Promise<void>
  createKey: (name: string) => Promise<{ key: string }>
  deleteKey: (id: string) => Promise<void>
}

export const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  keys: [],
  loading: false,
  error: null,

  fetchKeys: async () => {
    set({ loading: true, error: null })
    try {
      const keys = await apiKeysClient.listKeys()
      set({ keys, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        loading: false,
      })
    }
  },

  createKey: async (name: string) => {
    set({ error: null })
    try {
      const result = await apiKeysClient.createKey(name)
      const newKey: ApiKey = {
        id: result.id,
        name: result.name,
        keyHash: '',
        createdAt: result.createdAt,
        lastUsedAt: null,
      }
      set((state) => ({ keys: [...state.keys, newKey] }))
      return { key: result.key }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ error: message })
      throw err
    }
  },

  deleteKey: async (id: string) => {
    const previousKeys = get().keys
    // Optimistic removal
    set((state) => ({ keys: state.keys.filter((k) => k.id !== id), error: null }))
    try {
      await apiKeysClient.deleteKey(id)
    } catch (err) {
      // Rollback on failure
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ keys: previousKeys, error: message })
      throw err
    }
  },
}))
