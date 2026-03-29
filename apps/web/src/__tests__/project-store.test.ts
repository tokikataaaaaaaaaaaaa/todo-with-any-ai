import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const mockApiClient = vi.hoisted(() => ({
  listTodos: vi.fn(),
  getTodoTree: vi.fn(),
  getTodo: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleComplete: vi.fn(),
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient,
}))

vi.mock('@/lib/firebase', () => ({
  auth: null,
}))

import { useProjectStore } from '@/stores/project-store'
import type { Project, CreateProject, UpdateProject } from '@todo-with-any-ai/shared'

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Work',
  color: '#6366F1',
  emoji: '💼',
  order: 0,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('useProjectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useProjectStore.getState().reset()
    })
  })

  describe('fetchProjects', () => {
    it('should fetch projects and update state', async () => {
      const projects = [makeProject(), makeProject({ id: 'proj-2', name: 'Personal' })]
      mockApiClient.listProjects.mockResolvedValueOnce(projects)

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })

      const state = useProjectStore.getState()
      expect(state.projects).toEqual(projects)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set loading to true while fetching', async () => {
      let resolvePromise: (value: Project[]) => void
      mockApiClient.listProjects.mockReturnValueOnce(
        new Promise<Project[]>((resolve) => { resolvePromise = resolve })
      )

      const fetchPromise = act(async () => {
        const p = useProjectStore.getState().fetchProjects()
        expect(useProjectStore.getState().loading).toBe(true)
        resolvePromise!([])
        await p
      })

      await fetchPromise
      expect(useProjectStore.getState().loading).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockApiClient.listProjects.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })

      const state = useProjectStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.loading).toBe(false)
    })

    it('should clear previous error on successful fetch', async () => {
      mockApiClient.listProjects.mockRejectedValueOnce(new Error('First error'))
      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })
      expect(useProjectStore.getState().error).toBe('First error')

      mockApiClient.listProjects.mockResolvedValueOnce([makeProject()])
      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })
      expect(useProjectStore.getState().error).toBeNull()
    })
  })

  describe('createProject', () => {
    it('should optimistically add project then update with server response', async () => {
      const createData: CreateProject = {
        name: 'New Project',
        color: '#E11D48',
        emoji: '🏠',
        dueDate: null,
      }
      const serverProject = makeProject({ id: 'server-p1', name: 'New Project', color: '#E11D48', emoji: '🏠' })
      mockApiClient.createProject.mockResolvedValueOnce(serverProject)

      await act(async () => {
        await useProjectStore.getState().createProject(createData)
      })

      const state = useProjectStore.getState()
      expect(state.projects).toHaveLength(1)
      expect(state.projects[0].id).toBe('server-p1')
      expect(state.projects[0].name).toBe('New Project')
    })

    it('should rollback on create failure', async () => {
      mockApiClient.createProject.mockRejectedValueOnce(new Error('Server error'))

      await act(async () => {
        await useProjectStore.getState().createProject({
          name: 'Will Fail',
          color: '#6366F1',
          emoji: '💼',
          dueDate: null,
        })
      })

      const state = useProjectStore.getState()
      expect(state.projects).toHaveLength(0)
      expect(state.error).toBe('Server error')
    })

    it('should assign temp id starting with temp-', async () => {
      let capturedProjects: Project[] = []
      mockApiClient.createProject.mockImplementationOnce(async () => {
        capturedProjects = useProjectStore.getState().projects
        return makeProject({ id: 'server-1' })
      })

      await act(async () => {
        await useProjectStore.getState().createProject({
          name: 'Test',
          color: '#6366F1',
          emoji: '💼',
          dueDate: null,
        })
      })

      expect(capturedProjects).toHaveLength(1)
      expect(capturedProjects[0].id).toMatch(/^temp-/)
    })
  })

  describe('updateProject', () => {
    it('should optimistically update project', async () => {
      const project = makeProject({ name: 'Original' })
      mockApiClient.listProjects.mockResolvedValueOnce([project])
      mockApiClient.updateProject.mockResolvedValueOnce({ ...project, name: 'Updated' })

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })

      await act(async () => {
        await useProjectStore.getState().updateProject('proj-1', { name: 'Updated' })
      })

      expect(useProjectStore.getState().projects[0].name).toBe('Updated')
    })

    it('should rollback on update failure', async () => {
      const project = makeProject({ name: 'Original' })
      mockApiClient.listProjects.mockResolvedValueOnce([project])
      mockApiClient.updateProject.mockRejectedValueOnce(new Error('Update failed'))

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })

      await act(async () => {
        await useProjectStore.getState().updateProject('proj-1', { name: 'Will Fail' })
      })

      const state = useProjectStore.getState()
      expect(state.projects[0].name).toBe('Original')
      expect(state.error).toBe('Update failed')
    })
  })

  describe('deleteProject', () => {
    it('should optimistically remove project', async () => {
      const project = makeProject()
      mockApiClient.listProjects.mockResolvedValueOnce([project])
      mockApiClient.deleteProject.mockResolvedValueOnce(undefined)

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })
      expect(useProjectStore.getState().projects).toHaveLength(1)

      await act(async () => {
        await useProjectStore.getState().deleteProject('proj-1')
      })

      expect(useProjectStore.getState().projects).toHaveLength(0)
    })

    it('should rollback on delete failure', async () => {
      const project = makeProject()
      mockApiClient.listProjects.mockResolvedValueOnce([project])
      mockApiClient.deleteProject.mockRejectedValueOnce(new Error('Delete failed'))

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })

      await act(async () => {
        await useProjectStore.getState().deleteProject('proj-1')
      })

      const state = useProjectStore.getState()
      expect(state.projects).toHaveLength(1)
      expect(state.error).toBe('Delete failed')
    })

    it('should pass deleteTodos flag to api client', async () => {
      const project = makeProject()
      mockApiClient.listProjects.mockResolvedValueOnce([project])
      mockApiClient.deleteProject.mockResolvedValueOnce(undefined)

      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })

      await act(async () => {
        await useProjectStore.getState().deleteProject('proj-1', true)
      })

      expect(mockApiClient.deleteProject).toHaveBeenCalledWith('proj-1', true)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockApiClient.listProjects.mockResolvedValueOnce([makeProject()])
      await act(async () => {
        await useProjectStore.getState().fetchProjects()
      })
      expect(useProjectStore.getState().projects).toHaveLength(1)

      act(() => {
        useProjectStore.getState().reset()
      })

      const state = useProjectStore.getState()
      expect(state.projects).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
