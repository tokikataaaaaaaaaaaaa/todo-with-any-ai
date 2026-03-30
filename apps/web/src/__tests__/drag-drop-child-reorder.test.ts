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
  urgencyLevelId: null,
  startTime: null,
  endTime: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('moveTodo - child reordering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useTodoStore.getState().reset()
    })
  })

  it('should reorder children within the same parent using before', async () => {
    const parent = makeTodo({ id: 'parent', order: 0, depth: 0 })
    const childA = makeTodo({ id: 'child-a', parentId: 'parent', order: 0, depth: 1 })
    const childB = makeTodo({ id: 'child-b', parentId: 'parent', order: 1, depth: 1 })
    const childC = makeTodo({ id: 'child-c', parentId: 'parent', order: 2, depth: 1 })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [parent, childA, childB, childC] })
    })

    // Move child-c before child-a => new order: child-c(0), child-a(1), child-b(2)
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-c', 'child-a', 'before')
    })

    const todos = useTodoStore.getState().todos
    const children = todos
      .filter((t) => t.parentId === 'parent')
      .sort((a, b) => a.order - b.order)
    expect(children.map((t) => t.id)).toEqual(['child-c', 'child-a', 'child-b'])
  })

  it('should reorder children within the same parent using after', async () => {
    const parent = makeTodo({ id: 'parent', order: 0, depth: 0 })
    const childA = makeTodo({ id: 'child-a', parentId: 'parent', order: 0, depth: 1 })
    const childB = makeTodo({ id: 'child-b', parentId: 'parent', order: 1, depth: 1 })
    const childC = makeTodo({ id: 'child-c', parentId: 'parent', order: 2, depth: 1 })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [parent, childA, childB, childC] })
    })

    // Move child-a after child-c => new order: child-b(0), child-c(1), child-a(2)
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-a', 'child-c', 'after')
    })

    const todos = useTodoStore.getState().todos
    const children = todos
      .filter((t) => t.parentId === 'parent')
      .sort((a, b) => a.order - b.order)
    expect(children.map((t) => t.id)).toEqual(['child-b', 'child-c', 'child-a'])
  })
})

describe('moveTodo - child to root', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useTodoStore.getState().reset()
    })
  })

  it('should move a child to root level when dropped before a root todo', async () => {
    const rootA = makeTodo({ id: 'root-a', parentId: null, order: 0, depth: 0 })
    const rootB = makeTodo({ id: 'root-b', parentId: null, order: 1, depth: 0 })
    const childA = makeTodo({ id: 'child-a', parentId: 'root-a', order: 0, depth: 1 })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [rootA, rootB, childA] })
    })

    // Move child-a before root-b => child-a becomes root level
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-a', 'root-b', 'before')
    })

    const movedTodo = useTodoStore.getState().todos.find((t) => t.id === 'child-a')
    expect(movedTodo?.parentId).toBeNull()
    expect(movedTodo?.depth).toBe(0)
  })

  it('should move a child to root level when dropped after a root todo', async () => {
    const rootA = makeTodo({ id: 'root-a', parentId: null, order: 0, depth: 0 })
    const rootB = makeTodo({ id: 'root-b', parentId: null, order: 1, depth: 0 })
    const childA = makeTodo({ id: 'child-a', parentId: 'root-a', order: 0, depth: 1 })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [rootA, rootB, childA] })
    })

    // Move child-a after root-a => child-a becomes root level, between root-a and root-b
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-a', 'root-a', 'after')
    })

    const movedTodo = useTodoStore.getState().todos.find((t) => t.id === 'child-a')
    expect(movedTodo?.parentId).toBeNull()
    expect(movedTodo?.depth).toBe(0)

    // Verify order: root-a(0), child-a(1), root-b(2)
    const rootTodos = useTodoStore.getState().todos
      .filter((t) => t.parentId === null)
      .sort((a, b) => a.order - b.order)
    expect(rootTodos.map((t) => t.id)).toEqual(['root-a', 'child-a', 'root-b'])
  })

  it('should send parentId:null and depth:0 to API when moving child to root', async () => {
    const rootA = makeTodo({ id: 'root-a', parentId: null, order: 0, depth: 0 })
    const childA = makeTodo({ id: 'child-a', parentId: 'root-a', order: 0, depth: 1 })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [rootA, childA] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('child-a', 'root-a', 'after')
    })

    expect(mockApiClient.updateTodo).toHaveBeenCalledWith(
      'child-a',
      expect.objectContaining({
        parentId: null,
        depth: 0,
      })
    )
  })
})
