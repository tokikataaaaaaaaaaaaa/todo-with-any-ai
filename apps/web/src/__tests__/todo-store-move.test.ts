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
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient,
}))

vi.mock('@/lib/firebase', () => ({
  auth: null,
}))

import { useTodoStore } from '@/stores/todo-store'
import type { Todo } from '@todo-with-any-ai/shared'

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
  description: null,
  projectId: null,

  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('useTodoStore.moveTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useTodoStore.getState().reset()
    })
  })

  it('should set parentId when position is child', async () => {
    const todo1 = makeTodo({ id: 'todo-1', order: 0, depth: 0 })
    const todo2 = makeTodo({ id: 'todo-2', order: 1, depth: 0 })

    mockApiClient.updateTodo.mockResolvedValueOnce({
      ...todo1,
      parentId: 'todo-2',
      depth: 1,
      order: 0,
    })

    act(() => {
      useTodoStore.setState({ todos: [todo1, todo2] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('todo-1', 'todo-2', 'child')
    })

    expect(mockApiClient.updateTodo).toHaveBeenCalledWith('todo-1', expect.objectContaining({
      parentId: 'todo-2',
      depth: 1,
    }))
  })

  it('should reorder all siblings when position is before', async () => {
    const todo1 = makeTodo({ id: 'todo-1', order: 0, depth: 0 })
    const todo2 = makeTodo({ id: 'todo-2', order: 1, depth: 0 })
    const todo3 = makeTodo({ id: 'todo-3', order: 2, depth: 0 })

    // Move todo-3 before todo-1 => new order: todo-3(0), todo-1(1), todo-2(2)
    mockApiClient.updateTodo.mockResolvedValue({
      ...todo3,
      order: 0,
    })

    act(() => {
      useTodoStore.setState({ todos: [todo1, todo2, todo3] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('todo-3', 'todo-1', 'before')
    })

    // Verify all siblings got new orders in optimistic state
    const todos = useTodoStore.getState().todos
    const orderedTodos = [...todos].filter((t) => t.parentId === null).sort((a, b) => a.order - b.order)
    expect(orderedTodos.map((t) => t.id)).toEqual(['todo-3', 'todo-1', 'todo-2'])

    // API should be called for all siblings that changed order
    expect(mockApiClient.updateTodo).toHaveBeenCalledWith('todo-3', expect.objectContaining({
      order: 0,
      parentId: null,
    }))
    expect(mockApiClient.updateTodo).toHaveBeenCalledWith('todo-1', expect.objectContaining({
      order: 1,
    }))
    expect(mockApiClient.updateTodo).toHaveBeenCalledWith('todo-2', expect.objectContaining({
      order: 2,
    }))
  })

  it('should reorder all siblings when position is after', async () => {
    const todo1 = makeTodo({ id: 'todo-1', order: 0, depth: 0 })
    const todo2 = makeTodo({ id: 'todo-2', order: 1, depth: 0 })
    const todo3 = makeTodo({ id: 'todo-3', order: 2, depth: 0 })

    // Move todo-1 after todo-2 => new order: todo-2(0), todo-1(1), todo-3(2)
    mockApiClient.updateTodo.mockResolvedValue({
      ...todo1,
      order: 1,
    })

    act(() => {
      useTodoStore.setState({ todos: [todo1, todo2, todo3] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('todo-1', 'todo-2', 'after')
    })

    // Verify siblings got correct order
    const todos = useTodoStore.getState().todos
    const orderedTodos = [...todos].filter((t) => t.parentId === null).sort((a, b) => a.order - b.order)
    expect(orderedTodos.map((t) => t.id)).toEqual(['todo-2', 'todo-1', 'todo-3'])
  })

  it('should recalculate depth for child position', async () => {
    const parent = makeTodo({ id: 'parent', depth: 2 })
    const moved = makeTodo({ id: 'moved', depth: 0 })

    mockApiClient.updateTodo.mockResolvedValue({
      ...moved,
      parentId: 'parent',
      depth: 3,
    })

    act(() => {
      useTodoStore.setState({ todos: [parent, moved] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('moved', 'parent', 'child')
    })

    expect(mockApiClient.updateTodo).toHaveBeenCalledWith('moved', expect.objectContaining({
      depth: 3,
    }))
  })

  it('should optimistically update local state', async () => {
    const todo1 = makeTodo({ id: 'todo-1', order: 0, depth: 0 })
    const todo2 = makeTodo({ id: 'todo-2', order: 1, depth: 0 })

    // Make API call hang so we can observe optimistic state
    let resolveApi: (value: Todo) => void
    mockApiClient.updateTodo.mockReturnValue(
      new Promise<Todo>((resolve) => {
        resolveApi = resolve
      })
    )

    act(() => {
      useTodoStore.setState({ todos: [todo1, todo2] })
    })

    // Start the move but don't await
    let movePromise: Promise<void>
    act(() => {
      movePromise = useTodoStore.getState().moveTodo('todo-1', 'todo-2', 'child')
    })

    // Check optimistic update happened
    const optimisticTodo = useTodoStore.getState().todos.find((t) => t.id === 'todo-1')
    expect(optimisticTodo?.parentId).toBe('todo-2')
    expect(optimisticTodo?.depth).toBe(1)

    // Resolve API
    await act(async () => {
      resolveApi!({ ...todo1, parentId: 'todo-2', depth: 1, order: 0 })
      await movePromise!
    })
  })

  it('should rollback on API error', async () => {
    const todo1 = makeTodo({ id: 'todo-1', order: 0, depth: 0 })
    const todo2 = makeTodo({ id: 'todo-2', order: 1, depth: 0 })

    mockApiClient.updateTodo.mockRejectedValue(new Error('API error'))

    act(() => {
      useTodoStore.setState({ todos: [todo1, todo2] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('todo-1', 'todo-2', 'child')
    })

    // Should rollback to original state
    const rolledBackTodo = useTodoStore.getState().todos.find((t) => t.id === 'todo-1')
    expect(rolledBackTodo?.parentId).toBe(null)
    expect(rolledBackTodo?.depth).toBe(0)
  })
})
