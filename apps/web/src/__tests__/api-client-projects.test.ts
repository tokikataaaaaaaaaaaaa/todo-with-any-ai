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

describe('apiClient - project methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('mock-token-123')
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  let apiClient: typeof import('@/lib/api-client').apiClient

  beforeEach(async () => {
    const mod = await import('@/lib/api-client')
    apiClient = mod.apiClient
  })

  describe('listProjects', () => {
    it('should call GET /projects with auth headers', async () => {
      const mockProjects = [
        { id: 'p1', name: 'Work', color: '#6366F1', emoji: '💼' },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => mockProjects,
      })

      const result = await apiClient.listProjects()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token-123',
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockProjects)
    })

    it('should return empty array when no projects exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => [],
      })

      const result = await apiClient.listProjects()
      expect(result).toEqual([])
    })

    it('should throw on server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Internal Server Error' }),
      })

      await expect(apiClient.listProjects()).rejects.toThrow('Internal Server Error')
    })
  })

  describe('createProject', () => {
    it('should call POST /projects with body', async () => {
      const createData = { name: 'Work', color: '#6366F1', emoji: '💼', dueDate: null }
      const createdProject = { id: 'p1', ...createData, order: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => createdProject,
      })

      const result = await apiClient.createProject(createData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(createdProject)
    })
  })

  describe('updateProject', () => {
    it('should call PATCH /projects/:id with body', async () => {
      const updateData = { name: 'Updated Work' }
      const updatedProject = { id: 'p1', name: 'Updated Work', color: '#6366F1', emoji: '💼' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => updatedProject,
      })

      const result = await apiClient.updateProject('p1', updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/p1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      )
      expect(result).toEqual(updatedProject)
    })
  })

  describe('deleteProject', () => {
    it('should call DELETE /projects/:id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => ({}),
      })

      await apiClient.deleteProject('p1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/p1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should call DELETE /projects/:id with deleteTodos query param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders(),
        json: async () => ({}),
      })

      await apiClient.deleteProject('p1', true)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/p1?deleteTodos=true',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
