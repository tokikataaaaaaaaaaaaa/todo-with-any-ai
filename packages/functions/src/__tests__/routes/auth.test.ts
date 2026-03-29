import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { setApiKeyService } from '../../routes/auth'
import type { ApiKeyService } from '../../services/api-key-service'

// Mock ApiKeyService
const mockApiKeyService = {
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  deleteApiKey: vi.fn(),
  verifyApiKey: vi.fn(),
  countApiKeys: vi.fn(),
} as unknown as ApiKeyService

import { authRoute } from '../../routes/auth'

function createTestApp() {
  setApiKeyService(mockApiKeyService)

  const app = new Hono()

  // Simulate auth middleware
  app.use('/api/keys/*', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })
  app.use('/api/keys', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })

  app.route('/api/keys', authRoute)
  return app
}

describe('auth routes', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  // ==========================================
  // POST /api/keys
  // ==========================================
  describe('POST /api/keys', () => {
    it('should return 201 with key and metadata', async () => {
      ;(mockApiKeyService.createApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
        key: 'a'.repeat(64),
        id: 'key-1',
        name: 'My Key',
        createdAt: '2026-01-01T00:00:00.000Z',
      })

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Key' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.key).toHaveLength(64)
      expect(body.id).toBe('key-1')
      expect(body.name).toBe('My Key')
      expect(body.createdAt).toBeDefined()
    })

    it('should pass userId and name to service', async () => {
      ;(mockApiKeyService.createApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
        key: 'a'.repeat(64),
        id: 'key-1',
        name: 'Test',
        createdAt: '2026-01-01T00:00:00.000Z',
      })

      await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      })

      expect(mockApiKeyService.createApiKey).toHaveBeenCalledWith('test-user-123', 'Test')
    })

    it('should return 400 for empty name', async () => {
      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 for name with 101 characters', async () => {
      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(101) }),
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 for missing body', async () => {
      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid JSON', async () => {
      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })

      expect(res.status).toBe(400)
    })

    it('should return 409 when limit exceeded (5 keys)', async () => {
      ;(mockApiKeyService.createApiKey as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API key limit reached (max 5)')
      )

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Too Many' }),
      })

      expect(res.status).toBe(409)
    })

    it('should return 500 for unexpected service errors', async () => {
      ;(mockApiKeyService.createApiKey as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database connection failed')
      )

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Error Test' }),
      })

      expect(res.status).toBe(500)
    })

    it('should accept name with exactly 100 characters', async () => {
      const name100 = 'a'.repeat(100)
      ;(mockApiKeyService.createApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
        key: 'b'.repeat(64),
        id: 'key-2',
        name: name100,
        createdAt: '2026-01-01T00:00:00.000Z',
      })

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name100 }),
      })

      expect(res.status).toBe(201)
    })
  })

  // ==========================================
  // GET /api/keys
  // ==========================================
  describe('GET /api/keys', () => {
    it('should return 200 with array of keys', async () => {
      ;(mockApiKeyService.listApiKeys as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'key-1', name: 'Key 1', createdAt: '2026-01-01', lastUsedAt: null },
        { id: 'key-2', name: 'Key 2', createdAt: '2026-01-02', lastUsedAt: '2026-01-03' },
      ])

      const res = await app.request('/api/keys')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].id).toBe('key-1')
      expect(body[1].lastUsedAt).toBe('2026-01-03')
    })

    it('should return 200 with empty array when no keys', async () => {
      ;(mockApiKeyService.listApiKeys as ReturnType<typeof vi.fn>).mockResolvedValue([])

      const res = await app.request('/api/keys')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    })

    it('should pass userId to service', async () => {
      ;(mockApiKeyService.listApiKeys as ReturnType<typeof vi.fn>).mockResolvedValue([])

      await app.request('/api/keys')

      expect(mockApiKeyService.listApiKeys).toHaveBeenCalledWith('test-user-123')
    })
  })

  // ==========================================
  // DELETE /api/keys/:id
  // ==========================================
  describe('DELETE /api/keys/:id', () => {
    it('should return 204 on successful delete', async () => {
      ;(mockApiKeyService.deleteApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(true)

      const res = await app.request('/api/keys/key-1', { method: 'DELETE' })
      expect(res.status).toBe(204)
    })

    it('should return 404 when key not found', async () => {
      ;(mockApiKeyService.deleteApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(false)

      const res = await app.request('/api/keys/missing', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })

    it('should pass userId and keyId to service', async () => {
      ;(mockApiKeyService.deleteApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(true)

      await app.request('/api/keys/key-abc', { method: 'DELETE' })

      expect(mockApiKeyService.deleteApiKey).toHaveBeenCalledWith('test-user-123', 'key-abc')
    })

    it('should return 404 when key belongs to another user', async () => {
      ;(mockApiKeyService.deleteApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(false)

      const res = await app.request('/api/keys/other-users-key', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })
})
