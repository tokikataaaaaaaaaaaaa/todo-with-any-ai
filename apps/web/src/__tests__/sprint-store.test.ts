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
  listSprints: vi.fn(),
  createSprint: vi.fn(),
  getSprint: vi.fn(),
  updateSprint: vi.fn(),
  deleteSprint: vi.fn(),
  addTodoToSprint: vi.fn(),
  removeTodoFromSprint: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient,
}))

vi.mock('@/lib/firebase', () => ({
  auth: null,
}))

import { useSprintStore } from '@/stores/sprint-store'
import type { Sprint, CreateSprint } from '@todo-with-any-ai/shared'

const makeSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: 'sprint-1',
  name: 'Week 14',
  startDate: '2026-03-30',
  endDate: '2026-04-06',
  todoIds: [],
  createdAt: '2026-03-30T00:00:00Z',
  updatedAt: '2026-03-30T00:00:00Z',
  ...overrides,
})

describe('useSprintStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useSprintStore.getState().reset()
    })
  })

  describe('fetchSprints', () => {
    it('should fetch sprints and update state', async () => {
      const sprints = [makeSprint(), makeSprint({ id: 'sprint-2', name: 'Week 15' })]
      mockApiClient.listSprints.mockResolvedValueOnce(sprints)

      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })

      const state = useSprintStore.getState()
      expect(state.sprints).toEqual(sprints)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set loading to true while fetching', async () => {
      let resolvePromise: (value: Sprint[]) => void
      mockApiClient.listSprints.mockReturnValueOnce(
        new Promise<Sprint[]>((resolve) => { resolvePromise = resolve })
      )

      const fetchPromise = act(async () => {
        const p = useSprintStore.getState().fetchSprints()
        expect(useSprintStore.getState().loading).toBe(true)
        resolvePromise!([])
        await p
      })

      await fetchPromise
      expect(useSprintStore.getState().loading).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockApiClient.listSprints.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })

      const state = useSprintStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.loading).toBe(false)
    })
  })

  describe('createSprint', () => {
    it('should optimistically add sprint then update with server response', async () => {
      const createData: CreateSprint = {
        name: 'New Sprint',
        startDate: '2026-04-01',
        endDate: '2026-04-07',
        todoIds: [],
      }
      const serverSprint = makeSprint({ id: 'server-s1', name: 'New Sprint' })
      mockApiClient.createSprint.mockResolvedValueOnce(serverSprint)

      await act(async () => {
        await useSprintStore.getState().createSprint(createData)
      })

      const state = useSprintStore.getState()
      expect(state.sprints).toHaveLength(1)
      expect(state.sprints[0].id).toBe('server-s1')
      expect(state.sprints[0].name).toBe('New Sprint')
    })

    it('should rollback on create failure', async () => {
      mockApiClient.createSprint.mockRejectedValueOnce(new Error('Server error'))

      await act(async () => {
        await useSprintStore.getState().createSprint({
          name: 'Will Fail',
          startDate: '2026-04-01',
          endDate: '2026-04-07',
          todoIds: [],
        })
      })

      const state = useSprintStore.getState()
      expect(state.sprints).toHaveLength(0)
      expect(state.error).toBe('Server error')
    })
  })

  describe('deleteSprint', () => {
    it('should optimistically remove sprint', async () => {
      const sprint = makeSprint()
      mockApiClient.listSprints.mockResolvedValueOnce([sprint])
      mockApiClient.deleteSprint.mockResolvedValueOnce(undefined)

      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })
      expect(useSprintStore.getState().sprints).toHaveLength(1)

      await act(async () => {
        await useSprintStore.getState().deleteSprint('sprint-1')
      })

      expect(useSprintStore.getState().sprints).toHaveLength(0)
    })

    it('should rollback on delete failure', async () => {
      const sprint = makeSprint()
      mockApiClient.listSprints.mockResolvedValueOnce([sprint])
      mockApiClient.deleteSprint.mockRejectedValueOnce(new Error('Delete failed'))

      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })

      await act(async () => {
        await useSprintStore.getState().deleteSprint('sprint-1')
      })

      const state = useSprintStore.getState()
      expect(state.sprints).toHaveLength(1)
      expect(state.error).toBe('Delete failed')
    })
  })

  describe('addTodoToSprint', () => {
    it('should add todo to sprint optimistically', async () => {
      const sprint = makeSprint({ todoIds: [] })
      mockApiClient.listSprints.mockResolvedValueOnce([sprint])
      const updated = makeSprint({ todoIds: ['todo-1'] })
      mockApiClient.addTodoToSprint.mockResolvedValueOnce(updated)

      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })

      await act(async () => {
        await useSprintStore.getState().addTodoToSprint('sprint-1', 'todo-1')
      })

      expect(useSprintStore.getState().sprints[0].todoIds).toContain('todo-1')
    })
  })

  describe('removeTodoFromSprint', () => {
    it('should remove todo from sprint optimistically', async () => {
      const sprint = makeSprint({ todoIds: ['todo-1', 'todo-2'] })
      mockApiClient.listSprints.mockResolvedValueOnce([sprint])
      const updated = makeSprint({ todoIds: ['todo-2'] })
      mockApiClient.removeTodoFromSprint.mockResolvedValueOnce(updated)

      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })

      await act(async () => {
        await useSprintStore.getState().removeTodoFromSprint('sprint-1', 'todo-1')
      })

      expect(useSprintStore.getState().sprints[0].todoIds).not.toContain('todo-1')
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockApiClient.listSprints.mockResolvedValueOnce([makeSprint()])
      await act(async () => {
        await useSprintStore.getState().fetchSprints()
      })
      expect(useSprintStore.getState().sprints).toHaveLength(1)

      act(() => {
        useSprintStore.getState().reset()
      })

      const state = useSprintStore.getState()
      expect(state.sprints).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
