import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock the api-client module - use vi.hoisted to avoid hoisting issues
const mockApiClient = vi.hoisted(() => ({
  listTodos: vi.fn(),
  getTodoTree: vi.fn(),
  getTodo: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleComplete: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient,
}))

vi.mock('@/lib/firebase', () => ({
  auth: null,
}))

import { useTodoStore } from '@/stores/todo-store'
import type { Todo, CreateTodo, UpdateTodo } from '@todo-with-any-ai/shared'

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-1',
  title: 'Test Todo',
  completed: false,
  dueDate: null,
  parentId: null,
  order: 0,
  depth: 0,
  priority: null,
  categoryIcon: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('useTodoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    const { getState } = useTodoStore
    act(() => {
      getState().reset()
    })
  })

  describe('fetchTodos', () => {
    it('should fetch todos and update state', async () => {
      const todos = [makeTodo(), makeTodo({ id: 'todo-2', title: 'Second' })]
      mockApiClient.listTodos.mockResolvedValueOnce(todos)

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      const state = useTodoStore.getState()
      expect(state.todos).toEqual(todos)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set loading to true while fetching', async () => {
      let resolvePromise: (value: Todo[]) => void
      mockApiClient.listTodos.mockReturnValueOnce(
        new Promise<Todo[]>((resolve) => { resolvePromise = resolve })
      )

      const fetchPromise = act(async () => {
        const p = useTodoStore.getState().fetchTodos()
        // Check loading is true during fetch
        expect(useTodoStore.getState().loading).toBe(true)
        resolvePromise!([])
        await p
      })

      await fetchPromise
      expect(useTodoStore.getState().loading).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockApiClient.listTodos.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      const state = useTodoStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.loading).toBe(false)
    })
  })

  describe('createTodo', () => {
    it('should optimistically add todo then update with server response', async () => {
      const createData: CreateTodo = {
        title: 'New Todo',
        completed: false,
        parentId: null,
        order: 0,
        depth: 0,
        dueDate: null,
        priority: null,
        categoryIcon: null,
      }
      const serverTodo = makeTodo({ id: 'server-1', title: 'New Todo' })
      mockApiClient.createTodo.mockResolvedValueOnce(serverTodo)

      await act(async () => {
        await useTodoStore.getState().createTodo(createData)
      })

      const state = useTodoStore.getState()
      expect(state.todos).toHaveLength(1)
      expect(state.todos[0].id).toBe('server-1')
      expect(state.todos[0].title).toBe('New Todo')
    })

    it('should rollback on create failure', async () => {
      mockApiClient.createTodo.mockRejectedValueOnce(new Error('Server error'))

      await act(async () => {
        await useTodoStore.getState().createTodo({
          title: 'Will Fail',
          completed: false,
          parentId: null,
          order: 0,
          depth: 0,
          dueDate: null,
          priority: null,
          categoryIcon: null,
        })
      })

      const state = useTodoStore.getState()
      expect(state.todos).toHaveLength(0)
      expect(state.error).toBe('Server error')
    })
  })

  describe('deleteTodo', () => {
    it('should optimistically remove todo', async () => {
      const todo = makeTodo()
      mockApiClient.listTodos.mockResolvedValueOnce([todo])
      mockApiClient.deleteTodo.mockResolvedValueOnce(undefined)

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })
      expect(useTodoStore.getState().todos).toHaveLength(1)

      await act(async () => {
        await useTodoStore.getState().deleteTodo('todo-1')
      })

      expect(useTodoStore.getState().todos).toHaveLength(0)
    })

    it('should rollback on delete failure', async () => {
      const todo = makeTodo()
      mockApiClient.listTodos.mockResolvedValueOnce([todo])
      mockApiClient.deleteTodo.mockRejectedValueOnce(new Error('Delete failed'))

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      await act(async () => {
        await useTodoStore.getState().deleteTodo('todo-1')
      })

      const state = useTodoStore.getState()
      expect(state.todos).toHaveLength(1)
      expect(state.error).toBe('Delete failed')
    })
  })

  describe('toggleComplete', () => {
    it('should optimistically toggle completed status', async () => {
      const todo = makeTodo({ completed: false })
      mockApiClient.listTodos.mockResolvedValueOnce([todo])
      mockApiClient.toggleComplete.mockResolvedValueOnce({ ...todo, completed: true })

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      await act(async () => {
        await useTodoStore.getState().toggleComplete('todo-1')
      })

      expect(useTodoStore.getState().todos[0].completed).toBe(true)
    })

    it('should rollback on toggle failure', async () => {
      const todo = makeTodo({ completed: false })
      mockApiClient.listTodos.mockResolvedValueOnce([todo])
      mockApiClient.toggleComplete.mockRejectedValueOnce(new Error('Toggle failed'))

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      await act(async () => {
        await useTodoStore.getState().toggleComplete('todo-1')
      })

      const state = useTodoStore.getState()
      expect(state.todos[0].completed).toBe(false)
      expect(state.error).toBe('Toggle failed')
    })
  })

  describe('updateTodo', () => {
    it('should optimistically update todo', async () => {
      const todo = makeTodo({ title: 'Original' })
      mockApiClient.listTodos.mockResolvedValueOnce([todo])
      mockApiClient.updateTodo.mockResolvedValueOnce({ ...todo, title: 'Updated' })

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      await act(async () => {
        await useTodoStore.getState().updateTodo('todo-1', { title: 'Updated' })
      })

      expect(useTodoStore.getState().todos[0].title).toBe('Updated')
    })

    it('should rollback on update failure', async () => {
      const todo = makeTodo({ title: 'Original' })
      mockApiClient.listTodos.mockResolvedValueOnce([todo])
      mockApiClient.updateTodo.mockRejectedValueOnce(new Error('Update failed'))

      await act(async () => {
        await useTodoStore.getState().fetchTodos()
      })

      await act(async () => {
        await useTodoStore.getState().updateTodo('todo-1', { title: 'Will Fail' })
      })

      const state = useTodoStore.getState()
      expect(state.todos[0].title).toBe('Original')
      expect(state.error).toBe('Update failed')
    })
  })

  describe('toggleExpand', () => {
    it('should add id to expandedIds when not expanded', () => {
      act(() => {
        useTodoStore.getState().toggleExpand('todo-1')
      })

      expect(useTodoStore.getState().expandedIds.has('todo-1')).toBe(true)
    })

    it('should remove id from expandedIds when already expanded', () => {
      act(() => {
        useTodoStore.getState().toggleExpand('todo-1')
      })
      expect(useTodoStore.getState().expandedIds.has('todo-1')).toBe(true)

      act(() => {
        useTodoStore.getState().toggleExpand('todo-1')
      })
      expect(useTodoStore.getState().expandedIds.has('todo-1')).toBe(false)
    })
  })
})
