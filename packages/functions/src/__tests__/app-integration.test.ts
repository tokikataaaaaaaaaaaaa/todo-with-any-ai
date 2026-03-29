import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase-admin/auth before any imports
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}))

// Mock firebase lib (Firestore)
vi.mock('../lib/firebase', () => ({
  db: {
    collection: vi.fn(),
    collectionGroup: vi.fn(),
  },
}))

// Mock TodoService
const mockTodoService = {
  listTodos: vi.fn(),
  getTodoTree: vi.fn(),
  getTodo: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleComplete: vi.fn(),
}

// Mock ApiKeyService
const mockApiKeyService = {
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  deleteApiKey: vi.fn(),
  verifyApiKey: vi.fn(),
  countApiKeys: vi.fn(),
}

vi.mock('../services/todo-service', () => ({
  TodoService: vi.fn(() => mockTodoService),
}))

vi.mock('../services/api-key-service', () => ({
  ApiKeyService: vi.fn(() => mockApiKeyService),
}))

// We need to mock the authMiddleware to avoid actual Firebase calls
// but still test that it IS wired up (returns 401 without auth)
// We'll use partial mocking: let the real authMiddleware run,
// but firebase-admin and firestore are mocked above.

import { getAuth } from 'firebase-admin/auth'
import { db } from '../lib/firebase'
import { setTodoService } from '../routes/todos'
import { setApiKeyService } from '../routes/auth'
import { app } from '../app'

// Helper: create a valid mock user auth setup (API key style)
function setupValidApiKeyAuth(userId = 'test-user-123') {
  const mockGet = vi.fn().mockResolvedValue({
    empty: false,
    docs: [{ data: () => ({ userId, keyHash: 'hashed' }) }],
  })
  const mockLimit = vi.fn(() => ({ get: mockGet }))
  const mockWhere = vi.fn(() => ({ limit: mockLimit }))
  vi.mocked(db.collectionGroup).mockReturnValue({ where: mockWhere } as any)
}

function authHeaders(token = 'a'.repeat(64)) {
  return { Authorization: `Bearer ${token}` }
}

describe('App Integration - Routing & Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setTodoService(mockTodoService as any)
    setApiKeyService(mockApiKeyService as any)
  })

  // ===================================================================
  // Health check - no auth required
  // ===================================================================
  describe('GET /api/health', () => {
    it('should return 200 without authentication', async () => {
      const res = await app.request('/api/health')
      expect(res.status).toBe(200)
    })

    it('should return { status: "ok" }', async () => {
      const res = await app.request('/api/health')
      const body = await res.json()
      expect(body).toEqual({ status: 'ok' })
    })

    it('should NOT have X-RateLimit-Limit header', async () => {
      const res = await app.request('/api/health')
      expect(res.headers.get('X-RateLimit-Limit')).toBeNull()
    })
  })

  // ===================================================================
  // Unauthenticated access to protected routes -> 401
  // ===================================================================
  describe('Unauthenticated access', () => {
    it('GET /api/todos should return 401 without auth', async () => {
      const res = await app.request('/api/todos')
      expect(res.status).toBe(401)
    })

    it('POST /api/todos should return 401 without auth', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'test' }),
      })
      expect(res.status).toBe(401)
    })

    it('GET /api/keys should return 401 without auth', async () => {
      const res = await app.request('/api/keys')
      expect(res.status).toBe(401)
    })

    it('POST /api/keys should return 401 without auth', async () => {
      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test-key' }),
      })
      expect(res.status).toBe(401)
    })

    it('should return 401 with invalid API key', async () => {
      // Mock collectionGroup to return empty (key not found)
      const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] })
      const mockLimit = vi.fn(() => ({ get: mockGet }))
      const mockWhere = vi.fn(() => ({ limit: mockLimit }))
      vi.mocked(db.collectionGroup).mockReturnValue({ where: mockWhere } as any)

      const res = await app.request('/api/todos', {
        headers: { Authorization: 'Bearer ' + 'x'.repeat(64) },
      })
      expect(res.status).toBe(401)
    })
  })

  // ===================================================================
  // Authenticated access to /api/todos
  // ===================================================================
  describe('Authenticated /api/todos', () => {
    beforeEach(() => {
      setupValidApiKeyAuth()
    })

    it('GET /api/todos should return 200 with valid auth', async () => {
      mockTodoService.listTodos.mockResolvedValue([])
      const res = await app.request('/api/todos', { headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('POST /api/todos should return 201 on success', async () => {
      const todo = {
        id: 'new-1',
        title: 'New Todo',
        completed: false,
        dueDate: null,
        parentId: null,
        order: 0,
        depth: 0,
        priority: null,
        categoryIcon: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
      mockTodoService.createTodo.mockResolvedValue(todo)

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Todo' }),
      })
      expect(res.status).toBe(201)
    })

    it('GET /api/todos/tree should return 200', async () => {
      mockTodoService.getTodoTree.mockResolvedValue([])
      const res = await app.request('/api/todos/tree', { headers: authHeaders() })
      expect(res.status).toBe(200)
    })

    it('PATCH /api/todos/:id should return 200 when found', async () => {
      mockTodoService.updateTodo.mockResolvedValue({
        id: 'todo-1',
        title: 'Updated',
        completed: false,
        dueDate: null,
        parentId: null,
        order: 0,
        depth: 0,
        priority: null,
        categoryIcon: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })

      const res = await app.request('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })
      expect(res.status).toBe(200)
    })

    it('PATCH /api/todos/:id should return 404 when not found', async () => {
      mockTodoService.updateTodo.mockResolvedValue(null)

      const res = await app.request('/api/todos/nonexistent', {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })
      expect(res.status).toBe(404)
    })

    it('DELETE /api/todos/:id should return 204 when found', async () => {
      mockTodoService.deleteTodo.mockResolvedValue(1)

      const res = await app.request('/api/todos/todo-1', {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(204)
    })

    it('DELETE /api/todos/:id should return 404 when not found', async () => {
      mockTodoService.deleteTodo.mockResolvedValue(0)

      const res = await app.request('/api/todos/nonexistent', {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })

    it('POST /api/todos/:id/toggle should return 200 when found', async () => {
      mockTodoService.toggleComplete.mockResolvedValue({
        id: 'todo-1',
        title: 'Test',
        completed: true,
        dueDate: null,
        parentId: null,
        order: 0,
        depth: 0,
        priority: null,
        categoryIcon: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })

      const res = await app.request('/api/todos/todo-1/toggle', {
        method: 'POST',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })

    it('POST /api/todos/:id/toggle should return 404 when not found', async () => {
      mockTodoService.toggleComplete.mockResolvedValue(null)

      const res = await app.request('/api/todos/nonexistent/toggle', {
        method: 'POST',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })

  // ===================================================================
  // Authenticated access to /api/keys
  // ===================================================================
  describe('Authenticated /api/keys', () => {
    beforeEach(() => {
      setupValidApiKeyAuth()
    })

    it('POST /api/keys should return 201 on success', async () => {
      mockApiKeyService.createApiKey.mockResolvedValue({
        key: 'new-key',
        id: 'key-1',
        name: 'My Key',
        createdAt: '2026-01-01T00:00:00.000Z',
      })

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Key' }),
      })
      expect(res.status).toBe(201)
    })

    it('GET /api/keys should return 200', async () => {
      mockApiKeyService.listApiKeys.mockResolvedValue([])
      const res = await app.request('/api/keys', { headers: authHeaders() })
      expect(res.status).toBe(200)
    })

    it('DELETE /api/keys/:id should return 204 when found', async () => {
      mockApiKeyService.deleteApiKey.mockResolvedValue(true)

      const res = await app.request('/api/keys/key-1', {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(204)
    })

    it('DELETE /api/keys/:id should return 404 when not found', async () => {
      mockApiKeyService.deleteApiKey.mockResolvedValue(false)

      const res = await app.request('/api/keys/nonexistent', {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })

  // ===================================================================
  // Rate limiting headers
  // ===================================================================
  describe('Rate limiting', () => {
    beforeEach(() => {
      setupValidApiKeyAuth()
    })

    it('should include X-RateLimit-Limit header on /api/todos', async () => {
      mockTodoService.listTodos.mockResolvedValue([])
      const res = await app.request('/api/todos', { headers: authHeaders() })
      expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy()
    })

    it('should include X-RateLimit-Remaining header on /api/todos', async () => {
      mockTodoService.listTodos.mockResolvedValue([])
      const res = await app.request('/api/todos', { headers: authHeaders() })
      expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy()
    })

    it('should include X-RateLimit-Limit header on /api/keys', async () => {
      mockApiKeyService.listApiKeys.mockResolvedValue([])
      const res = await app.request('/api/keys', { headers: authHeaders() })
      expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy()
    })
  })
})
