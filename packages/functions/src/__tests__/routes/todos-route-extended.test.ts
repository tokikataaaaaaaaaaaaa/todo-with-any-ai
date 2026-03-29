import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import type { Todo } from '@todo-with-any-ai/shared'
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
  getChildrenCount: vi.fn(),
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

import { todosRoute } from '../../routes/todos'

function createTestApp() {
  setTodoService(mockTodoService)

  const app = new Hono()

  // Simulate auth middleware
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

describe('todos route - extended', () => {
  let app: Hono

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await createTestApp()
  })

  // ==========================================
  // GET /api/todos/:id/children-count
  // ==========================================
  describe('GET /api/todos/:id/children-count', () => {
    it('should return 200 with count when todo has children', async () => {
      mockTodoService.getChildrenCount.mockResolvedValue(3)

      const res = await app.request('/api/todos/parent-1/children-count')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual({ count: 3 })
    })

    it('should return 200 with count=0 when todo has no children', async () => {
      mockTodoService.getChildrenCount.mockResolvedValue(0)

      const res = await app.request('/api/todos/leaf-1/children-count')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual({ count: 0 })
    })

    it('should pass correct userId and todoId to service', async () => {
      mockTodoService.getChildrenCount.mockResolvedValue(0)

      await app.request('/api/todos/my-todo-id/children-count')
      expect(mockTodoService.getChildrenCount).toHaveBeenCalledWith(
        'test-user-123',
        'my-todo-id'
      )
    })

    it('should return 200 with count=0 for non-existent todo', async () => {
      // getChildrenCount returns 0 for non-existent (no children found)
      mockTodoService.getChildrenCount.mockResolvedValue(0)

      const res = await app.request('/api/todos/nonexistent/children-count')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual({ count: 0 })
    })
  })

  // ==========================================
  // GET /api/todos?sort=dueDate
  // ==========================================
  describe('GET /api/todos?sort=dueDate', () => {
    it('should pass sort=dueDate to service', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?sort=dueDate')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ sort: 'dueDate' })
      )
    })

    it('should return 200 with sorted todos', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-03-01' }),
        makeTodo({ id: 'b', dueDate: '2026-06-01' }),
      ]
      mockTodoService.listTodos.mockResolvedValue(todos)

      const res = await app.request('/api/todos?sort=dueDate')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
    })

    it('should not pass sort when not provided', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos')
      const call = mockTodoService.listTodos.mock.calls[0]
      // Either undefined or filters without sort
      if (call[1]) {
        expect(call[1]).not.toHaveProperty('sort')
      }
    })
  })

  // ==========================================
  // GET /api/todos?dueBefore=YYYY-MM-DD
  // ==========================================
  describe('GET /api/todos?dueBefore=YYYY-MM-DD', () => {
    it('should pass dueBefore to service', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?dueBefore=2026-04-30')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ dueBefore: '2026-04-30' })
      )
    })

    it('should return 200 with filtered todos', async () => {
      const todos = [makeTodo({ id: 'a', dueDate: '2026-04-01' })]
      mockTodoService.listTodos.mockResolvedValue(todos)

      const res = await app.request('/api/todos?dueBefore=2026-04-30')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(1)
    })

    it('should pass both sort and dueBefore when combined', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?sort=dueDate&dueBefore=2026-04-30')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          sort: 'dueDate',
          dueBefore: '2026-04-30',
        })
      )
    })

    it('should combine dueBefore with completed filter', async () => {
      mockTodoService.listTodos.mockResolvedValue([])

      await app.request('/api/todos?dueBefore=2026-04-30&completed=false')
      expect(mockTodoService.listTodos).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          dueBefore: '2026-04-30',
          completed: false,
        })
      )
    })
  })
})
