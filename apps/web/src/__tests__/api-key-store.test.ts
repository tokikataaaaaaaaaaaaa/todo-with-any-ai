import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiKeyStore } from '@/stores/api-key-store'
import { apiKeysClient } from '@/lib/api-keys-client'
import type { ApiKey } from '@todo-with-any-ai/shared'

vi.mock('@/lib/api-keys-client', () => ({
  apiKeysClient: {
    listKeys: vi.fn(),
    createKey: vi.fn(),
    deleteKey: vi.fn(),
  },
}))

const mockListKeys = apiKeysClient.listKeys as ReturnType<typeof vi.fn>
const mockCreateKey = apiKeysClient.createKey as ReturnType<typeof vi.fn>
const mockDeleteKey = apiKeysClient.deleteKey as ReturnType<typeof vi.fn>

describe('useApiKeyStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useApiKeyStore.setState({ keys: [], loading: false, error: null })
  })

  describe('fetchKeys', () => {
    it('should fetch keys and update state', async () => {
      const mockKeys: ApiKey[] = [
        { id: '1', name: 'key-1', keyHash: 'hash1', createdAt: '2026-01-01', lastUsedAt: null },
        { id: '2', name: 'key-2', keyHash: 'hash2', createdAt: '2026-01-02', lastUsedAt: '2026-01-03' },
      ]
      mockListKeys.mockResolvedValue(mockKeys)

      await useApiKeyStore.getState().fetchKeys()

      expect(useApiKeyStore.getState().keys).toEqual(mockKeys)
      expect(useApiKeyStore.getState().loading).toBe(false)
      expect(useApiKeyStore.getState().error).toBeNull()
    })

    it('should set loading true during fetch', async () => {
      let resolvePromise: (value: ApiKey[]) => void
      mockListKeys.mockReturnValue(new Promise<ApiKey[]>((resolve) => { resolvePromise = resolve }))

      const fetchPromise = useApiKeyStore.getState().fetchKeys()
      expect(useApiKeyStore.getState().loading).toBe(true)

      resolvePromise!([])
      await fetchPromise
      expect(useApiKeyStore.getState().loading).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockListKeys.mockRejectedValue(new Error('Network error'))

      await useApiKeyStore.getState().fetchKeys()

      expect(useApiKeyStore.getState().error).toBe('Network error')
      expect(useApiKeyStore.getState().loading).toBe(false)
      expect(useApiKeyStore.getState().keys).toEqual([])
    })
  })

  describe('createKey', () => {
    it('should create key and add to state', async () => {
      const existingKey: ApiKey = { id: '1', name: 'existing', keyHash: 'hash1', createdAt: '2026-01-01', lastUsedAt: null }
      useApiKeyStore.setState({ keys: [existingKey] })

      mockCreateKey.mockResolvedValue({
        key: 'sk-newkey',
        id: '2',
        name: 'new-key',
        createdAt: '2026-01-02',
      })

      const result = await useApiKeyStore.getState().createKey('new-key')

      expect(result).toEqual({ key: 'sk-newkey' })
      expect(useApiKeyStore.getState().keys).toHaveLength(2)
      expect(useApiKeyStore.getState().keys[1]).toMatchObject({
        id: '2',
        name: 'new-key',
      })
    })

    it('should throw and set error on create failure', async () => {
      mockCreateKey.mockRejectedValue(new Error('Limit reached'))

      await expect(useApiKeyStore.getState().createKey('bad')).rejects.toThrow('Limit reached')
      expect(useApiKeyStore.getState().error).toBe('Limit reached')
    })
  })

  describe('deleteKey', () => {
    it('should delete key and remove from state', async () => {
      const keys: ApiKey[] = [
        { id: '1', name: 'key-1', keyHash: 'hash1', createdAt: '2026-01-01', lastUsedAt: null },
        { id: '2', name: 'key-2', keyHash: 'hash2', createdAt: '2026-01-02', lastUsedAt: null },
      ]
      useApiKeyStore.setState({ keys })
      mockDeleteKey.mockResolvedValue(undefined)

      await useApiKeyStore.getState().deleteKey('1')

      expect(useApiKeyStore.getState().keys).toHaveLength(1)
      expect(useApiKeyStore.getState().keys[0].id).toBe('2')
    })

    it('should restore keys on delete failure (optimistic rollback)', async () => {
      const keys: ApiKey[] = [
        { id: '1', name: 'key-1', keyHash: 'hash1', createdAt: '2026-01-01', lastUsedAt: null },
      ]
      useApiKeyStore.setState({ keys })
      mockDeleteKey.mockRejectedValue(new Error('Server error'))

      await expect(useApiKeyStore.getState().deleteKey('1')).rejects.toThrow('Server error')

      expect(useApiKeyStore.getState().keys).toHaveLength(1)
      expect(useApiKeyStore.getState().keys[0].id).toBe('1')
      expect(useApiKeyStore.getState().error).toBe('Server error')
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      useApiKeyStore.setState({ keys: [], loading: false, error: null })
      const state = useApiKeyStore.getState()
      expect(state.keys).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
