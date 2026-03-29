import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiKeysClient } from '@/lib/api-keys-client'

// Mock firebase
const mockGetIdToken = vi.fn()

vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: () => mockGetIdToken(),
    },
  },
}))

describe('apiKeysClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    global.fetch = vi.fn()
  })

  describe('listKeys', () => {
    it('should GET /api/keys with auth header', async () => {
      const mockKeys = [
        { id: '1', name: 'key-1', keyHash: 'hash1', createdAt: '2026-01-01', lastUsedAt: null },
      ]
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ keys: mockKeys }),
      })

      const result = await apiKeysClient.listKeys()

      expect(global.fetch).toHaveBeenCalledWith('/api/keys', {
        headers: { Authorization: 'Bearer test-token' },
      })
      expect(result).toEqual(mockKeys)
    })

    it('should return empty array when no keys exist', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ keys: [] }),
      })

      const result = await apiKeysClient.listKeys()
      expect(result).toEqual([])
    })

    it('should throw on HTTP error from listKeys', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(apiKeysClient.listKeys()).rejects.toThrow()
    })
  })

  describe('createKey', () => {
    it('should POST /api/keys with name in body', async () => {
      const mockResponse = { key: 'sk-abc123', id: '2', name: 'my-key', createdAt: '2026-01-01' }
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiKeysClient.createKey('my-key')

      expect(global.fetch).toHaveBeenCalledWith('/api/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'my-key' }),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw on HTTP error from createKey', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(apiKeysClient.createKey('bad-key')).rejects.toThrow()
    })
  })

  describe('deleteKey', () => {
    it('should DELETE /api/keys/:id with auth header', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await apiKeysClient.deleteKey('key-123')

      expect(global.fetch).toHaveBeenCalledWith('/api/keys/key-123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-token' },
      })
    })

    it('should throw on HTTP error from deleteKey', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(apiKeysClient.deleteKey('nonexistent')).rejects.toThrow()
    })
  })

  describe('auth error', () => {
    it('should throw when no current user', async () => {
      const firebaseMod = await import('@/lib/firebase')
      // Temporarily set auth.currentUser to null
      const origAuth = firebaseMod.auth
      Object.defineProperty(firebaseMod, 'auth', { value: { currentUser: null }, writable: true })

      await expect(apiKeysClient.listKeys()).rejects.toThrow('Not authenticated')

      Object.defineProperty(firebaseMod, 'auth', { value: origAuth, writable: true })
    })
  })
})
