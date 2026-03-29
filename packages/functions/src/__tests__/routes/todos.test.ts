import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import type { Todo, TodoTreeNode } from '@todo-with-any-ai/shared'
import { setTodoService } from '../../routes/todos'
import type { TodoService } from '../../services/todo-service'

// Mock TodoService
const mockTodoService = {
  listTodos: vi.fn(),
  getTodoTree: vi.fn(),
  getTodo: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleComplete: vi.fn(),
} as unknown as TodoService

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    title: 'Test Todo',
    completed: false,
    dueDate: null,
    parentId: null,
    order: 0,
    depth: 0,
    priority: null,
    categoryIcon: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTreeNode(overrides: Partial<TodoTreeNode> = {}): TodoTreeNode {
  return {
    ...makeTodo(),
    children: [],
    ...overrides,
  }
}

import { todosRoute } from '../../routes/todos'

function createTestApp() {
  setTodoService(mockTodoService)

  const app = new Hono()

  // Simulate auth middleware - must match both exact and wildcard paths
  app.use('/api/todos/*', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })
  app.use('/api/todos', async (c: any, next: any) => {
    c.set('userId', 'test-user-123')
    await next()
  })

  app.route('/api/todos', todosRoute)
  return app
}

describe('todos route', () => {
  let app: Hono

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await createTestApp()
  })

  // ==========================================
  // GET /api/todos
  // ==========================================
  describe('GET /api/todos', () => {
    it('should return 200 with todo array', async () => {
      const todos = [makeTodo({ id: 'a' }), makeTodo({ id: 'b' })]
      mockTodoService.listTodos.mockResolvedValue(todos)

      const res = await app.request('/api/todos')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].id).toBe('a')
    })

    it('should pass completed=false query param to service', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?completed=false')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ completed: false })
      )
    })

    it('should pass completed=true query param to service', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?completed=true')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ completed: true })
      )
    })

    it('should pass parentId=null query param to service', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?parentId=null')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ parentId: null })
      )
    })

    it('should pass parentId query param to service', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?parentId=parent-123')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ parentId: 'parent-123' })
      )
    })

    it('should return empty array when no todos', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      const res = await app.request('/api/todos')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    })
  })

  // ==========================================
  // GET /api/todos/tree
  // ==========================================
  describe('GET /api/todos/tree', () => {
    it('should return 200 with tree structure', async () => {
      const tree = [
        makeTreeNode({
          id: 'root',
          children: [makeTreeNode({ id: 'child' })],
        }),
      ]
      mockTodoService.getTodoTree.mockResolvedValue(tree)

      const res = await app.request('/api/todos/tree')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(1)
      expect(body[0].id).toBe('root')
      expect(body[0].children).toHaveLength(1)
    })

    it('should return empty array when no todos', async () => {
      mockTodoService.getTodoTree.mockResolvedValue([])

      const res = await app.request('/api/todos/tree')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    })
  })

  // ==========================================
  // GET /api/todos/:id
  // ==========================================
  describe('GET /api/todos/:id', () => {
    it('should return 200 with todo when found', async () => {
      const todo = makeTodo({ id: 'todo-1' })
      mockTodoService.getTodo.mockResolvedValue(todo)

      const res = await app.request('/api/todos/todo-1')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.id).toBe('todo-1')
      expect(body.title).toBe('Test Todo')
    })

    it('should return 404 when todo not found', async () => {
      mockTodoService.getTodo.mockResolvedValue(null)

      const res = await app.request('/api/todos/missing')
      expect(res.status).toBe(404)
    })
  })

  // ==========================================
  // POST /api/todos
  // ==========================================
  describe('POST /api/todos', () => {
    it('should return 201 with created todo', async () => {
      const created = makeTodo({ id: 'new-todo', title: 'Created' })
      mockTodoService.createTodo.mockResolvedValue(created)

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Created' }),
      })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.id).toBe('new-todo')
      expect(body.title).toBe('Created')
    })

    it('should return 400 for empty title', async () => {
      mockTodoService.createTodo.mockRejectedValue(new Error('Validation error'))

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for title exceeding 255 characters', async () => {
      mockTodoService.createTodo.mockRejectedValue(new Error('Validation error'))

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'a'.repeat(256) }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for missing title', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid parentId (parent not found)', async () => {
      mockTodoService.createTodo.mockRejectedValue(new Error('Parent not found'))

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Child', parentId: 'nonexistent' }),
      })
      expect(res.status).toBe(400)
    })

    it('should return 201 with parentId when valid', async () => {
      const created = makeTodo({ id: 'child', parentId: 'parent-1', depth: 1 })
      mockTodoService.createTodo.mockResolvedValue(created)

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Child', parentId: 'parent-1' }),
      })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.parentId).toBe('parent-1')
      expect(body.depth).toBe(1)
    })

    it('should return 400 when body is not valid JSON', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
      expect(res.status).toBe(400)
    })
  })

  // ==========================================
  // PATCH /api/todos/:id
  // ==========================================
  describe('PATCH /api/todos/:id', () => {
    it('should return 200 with updated todo', async () => {
      const updated = makeTodo({ id: 'todo-1', title: 'Updated' })
      mockTodoService.updateTodo.mockResolvedValue(updated)

      const res = await app.request('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.title).toBe('Updated')
    })

    it('should return 404 when todo not found', async () => {
      mockTodoService.updateTodo.mockResolvedValue(null)

      const res = await app.request('/api/todos/missing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nope' }),
      })
      expect(res.status).toBe(404)
    })

    it('should accept partial update with only dueDate', async () => {
      const updated = makeTodo({ id: 'todo-1', dueDate: '2026-12-31' })
      mockTodoService.updateTodo.mockResolvedValue(updated)

      const res = await app.request('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: '2026-12-31' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.dueDate).toBe('2026-12-31')
    })

    it('should accept empty object update', async () => {
      const updated = makeTodo({ id: 'todo-1' })
      mockTodoService.updateTodo.mockResolvedValue(updated)

      const res = await app.request('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(200)
    })
  })

  // ==========================================
  // DELETE /api/todos/:id
  // ==========================================
  describe('DELETE /api/todos/:id', () => {
    it('should return 204 on successful delete', async () => {
      mockTodoService.deleteTodo.mockResolvedValue(1)

      const res = await app.request('/api/todos/todo-1', { method: 'DELETE' })
      expect(res.status).toBe(204)
    })

    it('should return 404 when todo not found', async () => {
      mockTodoService.deleteTodo.mockResolvedValue(0)

      const res = await app.request('/api/todos/missing', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })

    it('should return 204 for cascade delete of parent with children', async () => {
      mockTodoService.deleteTodo.mockResolvedValue(3)

      const res = await app.request('/api/todos/parent', { method: 'DELETE' })
      expect(res.status).toBe(204)
    })
  })

  // ==========================================
  // POST /api/todos/:id/toggle
  // ==========================================
  describe('POST /api/todos/:id/toggle', () => {
    it('should return 200 with toggled todo', async () => {
      const toggled = makeTodo({ id: 'todo-1', completed: true })
      mockTodoService.toggleComplete.mockResolvedValue(toggled)

      const res = await app.request('/api/todos/todo-1/toggle', { method: 'POST' })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.completed).toBe(true)
    })

    it('should return 404 when todo not found', async () => {
      mockTodoService.toggleComplete.mockResolvedValue(null)

      const res = await app.request('/api/todos/missing/toggle', { method: 'POST' })
      expect(res.status).toBe(404)
    })

    it('should toggle from true to false', async () => {
      const toggled = makeTodo({ id: 'todo-1', completed: false })
      mockTodoService.toggleComplete.mockResolvedValue(toggled)

      const res = await app.request('/api/todos/todo-1/toggle', { method: 'POST' })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.completed).toBe(false)
    })
  })
})
