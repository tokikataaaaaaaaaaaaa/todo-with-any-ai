import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import type { Sprint } from '@todo-with-any-ai/shared'
import { setSprintService } from '../../routes/sprints'
import type { SprintService } from '../../services/sprint-service'

const mockSprintService = {
  createSprint: vi.fn(),
  listSprints: vi.fn(),
  getSprint: vi.fn(),
  updateSprint: vi.fn(),
  deleteSprint: vi.fn(),
  addTodoToSprint: vi.fn(),
  removeTodoFromSprint: vi.fn(),
} as unknown as SprintService

function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 'sprint-1',
    name: 'Week 14',
    startDate: '2026-03-30',
    endDate: '2026-04-06',
    todoIds: [],
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T00:00:00Z',
    ...overrides,
  }
}

import { sprintsRoute } from '../../routes/sprints'

function createTestApp() {
  setSprintService(mockSprintService)

  const app = new Hono()

  app.use('/api/sprints/*', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })
  app.use('/api/sprints', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })

  app.route('/api/sprints', sprintsRoute)
  return app
}

describe('sprints route', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  // GET /api/sprints
  describe('GET /api/sprints', () => {
    it('should return 200 with sprint array', async () => {
      const sprints = [makeSprint(), makeSprint({ id: 'sprint-2', name: 'Week 15' })]
      ;(mockSprintService.listSprints as any).mockResolvedValue(sprints)

      const res = await app.request('/api/sprints')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
    })

    it('should return empty array when no sprints', async () => {
      ;(mockSprintService.listSprints as any).mockResolvedValue([])

      const res = await app.request('/api/sprints')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    })
  })

  // POST /api/sprints
  describe('POST /api/sprints', () => {
    it('should return 201 with created sprint', async () => {
      const sprint = makeSprint()
      ;(mockSprintService.createSprint as any).mockResolvedValue(sprint)

      const res = await app.request('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Week 14',
          startDate: '2026-03-30',
          endDate: '2026-04-06',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.name).toBe('Week 14')
    })

    it('should return 400 for invalid JSON', async () => {
      const res = await app.request('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 for validation error (missing name)', async () => {
      const res = await app.request('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: '2026-03-30',
          endDate: '2026-04-06',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  // GET /api/sprints/:id
  describe('GET /api/sprints/:id', () => {
    it('should return 200 with sprint', async () => {
      ;(mockSprintService.getSprint as any).mockResolvedValue(makeSprint())

      const res = await app.request('/api/sprints/sprint-1')
      expect(res.status).toBe(200)
    })

    it('should return 404 when not found', async () => {
      ;(mockSprintService.getSprint as any).mockResolvedValue(null)

      const res = await app.request('/api/sprints/non-existent')
      expect(res.status).toBe(404)
    })
  })

  // PATCH /api/sprints/:id
  describe('PATCH /api/sprints/:id', () => {
    it('should return 200 with updated sprint', async () => {
      const updated = makeSprint({ name: 'Updated' })
      ;(mockSprintService.updateSprint as any).mockResolvedValue(updated)

      const res = await app.request('/api/sprints/sprint-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.name).toBe('Updated')
    })

    it('should return 404 when not found', async () => {
      ;(mockSprintService.updateSprint as any).mockResolvedValue(null)

      const res = await app.request('/api/sprints/non-existent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(res.status).toBe(404)
    })
  })

  // DELETE /api/sprints/:id
  describe('DELETE /api/sprints/:id', () => {
    it('should return 204 on success', async () => {
      ;(mockSprintService.deleteSprint as any).mockResolvedValue(1)

      const res = await app.request('/api/sprints/sprint-1', { method: 'DELETE' })
      expect(res.status).toBe(204)
    })

    it('should return 404 when not found', async () => {
      ;(mockSprintService.deleteSprint as any).mockResolvedValue(0)

      const res = await app.request('/api/sprints/non-existent', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })

  // POST /api/sprints/:id/todos/:todoId
  describe('POST /api/sprints/:id/todos/:todoId', () => {
    it('should return 200 with updated sprint', async () => {
      const updated = makeSprint({ todoIds: ['todo-1'] })
      ;(mockSprintService.addTodoToSprint as any).mockResolvedValue(updated)

      const res = await app.request('/api/sprints/sprint-1/todos/todo-1', { method: 'POST' })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.todoIds).toContain('todo-1')
    })

    it('should return 404 when sprint not found', async () => {
      ;(mockSprintService.addTodoToSprint as any).mockResolvedValue(null)

      const res = await app.request('/api/sprints/non-existent/todos/todo-1', { method: 'POST' })
      expect(res.status).toBe(404)
    })
  })

  // DELETE /api/sprints/:id/todos/:todoId
  describe('DELETE /api/sprints/:id/todos/:todoId', () => {
    it('should return 200 with updated sprint', async () => {
      const updated = makeSprint({ todoIds: [] })
      ;(mockSprintService.removeTodoFromSprint as any).mockResolvedValue(updated)

      const res = await app.request('/api/sprints/sprint-1/todos/todo-1', { method: 'DELETE' })
      expect(res.status).toBe(200)
    })

    it('should return 404 when sprint not found', async () => {
      ;(mockSprintService.removeTodoFromSprint as any).mockResolvedValue(null)

      const res = await app.request('/api/sprints/non-existent/todos/todo-1', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })
})
