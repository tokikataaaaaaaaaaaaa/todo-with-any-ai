import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock firebase module at top level
const mockGetIdToken = vi.fn().mockResolvedValue('mock-token-123')
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: (...args: unknown[]) => mockGetIdToken(...args),
    },
  },
}))

const mockFetch = vi.fn()

function mockHeaders(contentLength?: string) {
  return { get: (key: string) => key === 'content-length' ? (contentLength ?? null) : null }
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('mock-token-123')
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Use top-level import since mock is hoisted
  let apiClient: typeof import('@/lib/api-client').apiClient

  beforeEach(async () => {
    const mod = await import('@/lib/api-client')
    apiClient = mod.apiClient
  })

  describe('listTodos', () => {
    it('should call GET /todos with auth headers', async () => {
      const mockTodos = [{ id: '1', title: 'Test Todo' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => mockTodos,
      })

      const result = await apiClient.listTodos()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token-123',
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockTodos)
    })

    it('should append completed filter as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => [],
      })

      await apiClient.listTodos({ completed: true })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos?completed=true',
        expect.any(Object)
      )
    })

    it('should append parentId filter as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => [],
      })

      await apiClient.listTodos({ parentId: 'parent-1' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos?parentId=parent-1',
        expect.any(Object)
      )
    })

    it('should append parentId=null filter as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => [],
      })

      await apiClient.listTodos({ parentId: null })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos?parentId=null',
        expect.any(Object)
      )
    })

    it('should combine multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => [],
      })

      await apiClient.listTodos({ completed: false, parentId: 'p1' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('completed=false')
      expect(url).toContain('parentId=p1')
    })
  })

  describe('getTodoTree', () => {
    it('should call GET /todos/tree', async () => {
      const mockTree = [{ id: '1', title: 'Root', children: [] }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => mockTree,
      })

      const result = await apiClient.getTodoTree()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/tree',
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(mockTree)
    })
  })

  describe('getTodo', () => {
    it('should call GET /todos/:id', async () => {
      const mockTodo = { id: 'abc', title: 'Single Todo' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => mockTodo,
      })

      const result = await apiClient.getTodo('abc')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/abc',
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(mockTodo)
    })
  })

  describe('createTodo', () => {
    it('should call POST /todos with body', async () => {
      const newTodo = { title: 'New Todo', completed: false, parentId: null, order: 0, depth: 0, dueDate: null, startTime: null, endTime: null, priority: null, categoryIcon: null, projectId: null, urgencyLevelId: null, description: null }
      const createdTodo = { id: 'new-1', ...newTodo, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => createdTodo,
      })

      const result = await apiClient.createTodo(newTodo)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTodo),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(createdTodo)
    })
  })

  describe('updateTodo', () => {
    it('should call PATCH /todos/:id with body', async () => {
      const updateData = { title: 'Updated' }
      const updatedTodo = { id: 'u1', title: 'Updated', completed: false }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => updatedTodo,
      })

      const result = await apiClient.updateTodo('u1', updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/u1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      )
      expect(result).toEqual(updatedTodo)
    })
  })

  describe('deleteTodo', () => {
    it('should call DELETE /todos/:id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => ({}),
      })

      await apiClient.deleteTodo('del-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/del-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('toggleComplete', () => {
    it('should call POST /todos/:id/toggle', async () => {
      const toggled = { id: 't1', title: 'Toggled', completed: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => toggled,
      })

      const result = await apiClient.toggleComplete('t1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/t1/toggle',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual(toggled)
    })
  })

  describe('error handling', () => {
    it('should throw on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Unauthorized' }),
      })

      await expect(apiClient.listTodos()).rejects.toThrow('Unauthorized')
    })

    it('should throw on 404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      })

      await expect(apiClient.getTodo('nonexistent')).rejects.toThrow('Not Found')
    })

    it('should throw on 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Internal Server Error' }),
      })

      await expect(apiClient.listTodos()).rejects.toThrow('Internal Server Error')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.listTodos()).rejects.toThrow('Network error')
    })
  })

  describe('auth headers', () => {
    it('should send Content-Type without Authorization when no user', async () => {
      // Simulate no current user by making getIdToken return undefined
      mockGetIdToken.mockResolvedValueOnce(undefined)
      // Override: make the auth.currentUser null-like by returning no token
      // Actually we need to simulate auth.currentUser being null
      // The mock is set up with currentUser always having getIdToken
      // So we mock getIdToken to return falsy
      mockGetIdToken.mockResolvedValueOnce(null)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => [],
      })

      await apiClient.listTodos()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })
})
