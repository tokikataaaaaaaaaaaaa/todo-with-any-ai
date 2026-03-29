import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { setProjectService } from '../../routes/projects'
import type { ProjectService } from '../../services/project-service'

// Mock ProjectService
const mockProjectService = {
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
} as unknown as ProjectService

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proj-1',
    name: 'Test Project',
    color: '#FF5733',
    emoji: '\u{1F4BC}',
    order: 0,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

import { projectsRoute } from '../../routes/projects'

function createTestApp() {
  setProjectService(mockProjectService)

  const app = new Hono()

  // Simulate auth middleware - must match both exact and wildcard paths
  app.use('/api/projects/*', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })
  app.use('/api/projects', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })

  app.route('/api/projects', projectsRoute)
  return app
}

function createUnauthApp() {
  setProjectService(mockProjectService)

  const app = new Hono()
  // No auth middleware - userId will not be set
  app.route('/api/projects', projectsRoute)
  return app
}

describe('projects route', () => {
  let app: Hono

  beforeEach(async () => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  // ==========================================
  // POST /api/projects
  // ==========================================
  describe('POST /api/projects', () => {
    it('should return 201 with created project', async () => {
      const created = makeProject({ id: 'new-proj', name: 'New Project' })
      ;(mockProjectService.createProject as ReturnType<typeof vi.fn>).mockResolvedValue(created)

      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Project', color: '#FF5733', emoji: '\u{1F4BC}' }),
      })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.id).toBe('new-proj')
      expect(body.name).toBe('New Project')
    })

    it('should return 400 when name is missing', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '#FF5733', emoji: '\u{1F4BC}' }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 when name is empty', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', color: '#FF5733', emoji: '\u{1F4BC}' }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid color format (named color)', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', color: 'red', emoji: '\u{1F4BC}' }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid color hex (non-hex chars)', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', color: '#GGGGGG', emoji: '\u{1F4BC}' }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 201 with optional dueDate', async () => {
      const created = makeProject({ id: 'proj-2', name: 'With Date', dueDate: '2026-06-15' })
      ;(mockProjectService.createProject as ReturnType<typeof vi.fn>).mockResolvedValue(created)

      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'With Date', color: '#123456', emoji: '\u{1F4BC}', dueDate: '2026-06-15' }),
      })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.dueDate).toBe('2026-06-15')
    })

    it('should return 400 when body is not valid JSON', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for name exceeding 50 characters', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(51), color: '#FF5733', emoji: '\u{1F4BC}' }),
      })
      expect(res.status).toBe(400)
    })
  })

  // ==========================================
  // GET /api/projects
  // ==========================================
  describe('GET /api/projects', () => {
    it('should return 200 with project array', async () => {
      const projects = [makeProject({ id: 'a' }), makeProject({ id: 'b' })]
      ;(mockProjectService.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects)

      const res = await app.request('/api/projects')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].id).toBe('a')
    })

    it('should return empty array when no projects', async () => {
      ;(mockProjectService.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([])

      const res = await app.request('/api/projects')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    })
  })

  // ==========================================
  // PATCH /api/projects/:id
  // ==========================================
  describe('PATCH /api/projects/:id', () => {
    it('should return 200 with updated project', async () => {
      const updated = makeProject({ id: 'proj-1', name: 'Updated' })
      ;(mockProjectService.updateProject as ReturnType<typeof vi.fn>).mockResolvedValue(updated)

      const res = await app.request('/api/projects/proj-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.name).toBe('Updated')
    })

    it('should return 404 when project not found', async () => {
      ;(mockProjectService.updateProject as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const res = await app.request('/api/projects/missing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nope' }),
      })
      expect(res.status).toBe(404)
    })

    it('should accept partial update with only color', async () => {
      const updated = makeProject({ id: 'proj-1', color: '#000000' })
      ;(mockProjectService.updateProject as ReturnType<typeof vi.fn>).mockResolvedValue(updated)

      const res = await app.request('/api/projects/proj-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '#000000' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.color).toBe('#000000')
    })

    it('should accept empty object update', async () => {
      const updated = makeProject({ id: 'proj-1' })
      ;(mockProjectService.updateProject as ReturnType<typeof vi.fn>).mockResolvedValue(updated)

      const res = await app.request('/api/projects/proj-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(200)
    })

    it('should return 400 for invalid color in update', async () => {
      const res = await app.request('/api/projects/proj-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: 'bad-color' }),
      })
      expect(res.status).toBe(400)
    })
  })

  // ==========================================
  // DELETE /api/projects/:id
  // ==========================================
  describe('DELETE /api/projects/:id', () => {
    it('should return 204 on successful delete', async () => {
      ;(mockProjectService.deleteProject as ReturnType<typeof vi.fn>).mockResolvedValue(1)

      const res = await app.request('/api/projects/proj-1', { method: 'DELETE' })
      expect(res.status).toBe(204)
    })

    it('should return 404 when project not found', async () => {
      ;(mockProjectService.deleteProject as ReturnType<typeof vi.fn>).mockResolvedValue(0)

      const res = await app.request('/api/projects/missing', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })

    it('should pass deleteTodos=true query param to service', async () => {
      ;(mockProjectService.deleteProject as ReturnType<typeof vi.fn>).mockResolvedValue(1)

      const res = await app.request('/api/projects/proj-1?deleteTodos=true', { method: 'DELETE' })
      expect(res.status).toBe(204)
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith(
        'test-user-123',
        'proj-1',
        true
      )
    })

    it('should pass deleteTodos=false query param to service', async () => {
      ;(mockProjectService.deleteProject as ReturnType<typeof vi.fn>).mockResolvedValue(1)

      const res = await app.request('/api/projects/proj-1?deleteTodos=false', { method: 'DELETE' })
      expect(res.status).toBe(204)
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith(
        'test-user-123',
        'proj-1',
        false
      )
    })

    it('should default deleteTodos to false when not specified', async () => {
      ;(mockProjectService.deleteProject as ReturnType<typeof vi.fn>).mockResolvedValue(1)

      const res = await app.request('/api/projects/proj-1', { method: 'DELETE' })
      expect(res.status).toBe(204)
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith(
        'test-user-123',
        'proj-1',
        false
      )
    })
  })

  // ==========================================
  // Auth: userId not set
  // ==========================================
  describe('Unauthenticated access', () => {
    it('should return 401 when userId is not set', async () => {
      const unauthApp = createUnauthApp()

      const res = await unauthApp.request('/api/projects')
      expect(res.status).toBe(401)
    })
  })
})
