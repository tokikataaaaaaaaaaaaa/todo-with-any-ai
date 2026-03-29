import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { setUrgencyLevelService } from '../../routes/urgency-levels'
import type { UrgencyLevelService } from '../../services/urgency-level-service'

// Mock UrgencyLevelService
const mockService = {
  listUrgencyLevels: vi.fn(),
  createUrgencyLevel: vi.fn(),
  updateUrgencyLevel: vi.fn(),
  deleteUrgencyLevel: vi.fn(),
} as unknown as UrgencyLevelService

function makeLevel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'level-1',
    name: '緊急',
    color: '#DC2626',
    icon: '🔴',
    order: 0,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

import { urgencyLevelsRoute } from '../../routes/urgency-levels'

function createTestApp() {
  setUrgencyLevelService(mockService)

  const app = new Hono()

  // Simulate auth middleware
  app.use('/api/urgency-levels/*', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })
  app.use('/api/urgency-levels', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })

  app.route('/api/urgency-levels', urgencyLevelsRoute)
  return app
}

function createUnauthApp() {
  setUrgencyLevelService(mockService)

  const app = new Hono()

  // No auth middleware - simulate missing userId
  app.use('/api/urgency-levels/*', async (c: any, next: any) => {
    // Don't set userId
    await next()
  })
  app.use('/api/urgency-levels', async (c: any, next: any) => {
    // Don't set userId
    await next()
  })

  app.route('/api/urgency-levels', urgencyLevelsRoute)
  return app
}

describe('urgency-levels route', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  // ==========================================
  // GET /api/urgency-levels
  // ==========================================
  describe('GET /api/urgency-levels', () => {
    it('should return 200 with array of levels', async () => {
      const levels = [
        makeLevel({ id: 'a', name: '緊急' }),
        makeLevel({ id: 'b', name: '高' }),
      ]
      ;(mockService.listUrgencyLevels as any).mockResolvedValue(levels)

      const res = await app.request('/api/urgency-levels')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].name).toBe('緊急')
    })

    it('should return 200 with empty array when no levels', async () => {
      ;(mockService.listUrgencyLevels as any).mockResolvedValue([])

      const res = await app.request('/api/urgency-levels')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    })

    it('should return 401 when userId is missing', async () => {
      const unauthApp = createUnauthApp()
      ;(mockService.listUrgencyLevels as any).mockResolvedValue([])

      const res = await unauthApp.request('/api/urgency-levels')
      expect(res.status).toBe(401)
    })
  })

  // ==========================================
  // POST /api/urgency-levels
  // ==========================================
  describe('POST /api/urgency-levels', () => {
    it('should return 201 with created level', async () => {
      const created = makeLevel({ id: 'new-1', name: 'カスタム', isDefault: false })
      ;(mockService.createUrgencyLevel as any).mockResolvedValue(created)

      const res = await app.request('/api/urgency-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'カスタム',
          color: '#FF0000',
          icon: '🔥',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.name).toBe('カスタム')
    })

    it('should return 400 for invalid payload', async () => {
      const res = await app.request('/api/urgency-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          color: 'invalid',
          icon: '🔥',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 for missing required fields', async () => {
      const res = await app.request('/api/urgency-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      })

      expect(res.status).toBe(400)
    })
  })

  // ==========================================
  // PATCH /api/urgency-levels/:id
  // ==========================================
  describe('PATCH /api/urgency-levels/:id', () => {
    it('should return 200 with updated level', async () => {
      const updated = makeLevel({ id: 'level-1', name: 'Updated' })
      ;(mockService.updateUrgencyLevel as any).mockResolvedValue(updated)

      const res = await app.request('/api/urgency-levels/level-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.name).toBe('Updated')
    })

    it('should return 404 when level does not exist', async () => {
      ;(mockService.updateUrgencyLevel as any).mockResolvedValue(null)

      const res = await app.request('/api/urgency-levels/missing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nope' }),
      })

      expect(res.status).toBe(404)
    })

    it('should return 400 for invalid update data', async () => {
      const res = await app.request('/api/urgency-levels/level-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: 'not-a-color' }),
      })

      expect(res.status).toBe(400)
    })
  })

  // ==========================================
  // DELETE /api/urgency-levels/:id
  // ==========================================
  describe('DELETE /api/urgency-levels/:id', () => {
    it('should return 204 when custom level is deleted', async () => {
      ;(mockService.deleteUrgencyLevel as any).mockResolvedValue(true)

      const res = await app.request('/api/urgency-levels/custom-1', {
        method: 'DELETE',
      })

      expect(res.status).toBe(204)
    })

    it('should return 403 when trying to delete a default level', async () => {
      ;(mockService.deleteUrgencyLevel as any).mockRejectedValue(
        new Error('Cannot delete default urgency level')
      )

      const res = await app.request('/api/urgency-levels/default-1', {
        method: 'DELETE',
      })

      expect(res.status).toBe(403)
    })

    it('should return 404 when level does not exist', async () => {
      ;(mockService.deleteUrgencyLevel as any).mockResolvedValue(null)

      const res = await app.request('/api/urgency-levels/missing', {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
    })

    it('should return 401 when userId is missing', async () => {
      const unauthApp = createUnauthApp()

      const res = await unauthApp.request('/api/urgency-levels/custom-1', {
        method: 'DELETE',
      })

      expect(res.status).toBe(401)
    })
  })
})
