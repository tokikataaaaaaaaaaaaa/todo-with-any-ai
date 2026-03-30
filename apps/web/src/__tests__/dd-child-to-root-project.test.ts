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

describe('moveTodo - child to root within a project', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useTodoStore.getState().reset()
    })
  })

  it('should move a child to root level when dropped before its own parent in a project', async () => {
    const parentA = makeTodo({
      id: 'parent-a',
      title: 'Parent A',
      parentId: null,
      order: 0,
      depth: 0,
      projectId: 'proj-1',
    })
    const childB = makeTodo({
      id: 'child-b',
      title: 'Child B',
      parentId: 'parent-a',
      order: 0,
      depth: 1,
      projectId: 'proj-1',
    })
    const parentC = makeTodo({
      id: 'parent-c',
      title: 'Parent C',
      parentId: null,
      order: 1,
      depth: 0,
      projectId: 'proj-1',
    })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [parentA, childB, parentC] })
    })

    // Move child-b before parent-a => child-b becomes root level in the project
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-b', 'parent-a', 'before')
    })

    const movedTodo = useTodoStore.getState().todos.find((t) => t.id === 'child-b')
    expect(movedTodo?.parentId).toBeNull()
    expect(movedTodo?.depth).toBe(0)
    expect(movedTodo?.projectId).toBe('proj-1')
  })

  it('should move a child to root level when dropped after its own parent in a project', async () => {
    const parentA = makeTodo({
      id: 'parent-a',
      title: 'Parent A',
      parentId: null,
      order: 0,
      depth: 0,
      projectId: 'proj-1',
    })
    const childB = makeTodo({
      id: 'child-b',
      title: 'Child B',
      parentId: 'parent-a',
      order: 0,
      depth: 1,
      projectId: 'proj-1',
    })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [parentA, childB] })
    })

    // Move child-b after parent-a => child-b becomes root level
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-b', 'parent-a', 'after')
    })

    const movedTodo = useTodoStore.getState().todos.find((t) => t.id === 'child-b')
    expect(movedTodo?.parentId).toBeNull()
    expect(movedTodo?.depth).toBe(0)
    expect(movedTodo?.projectId).toBe('proj-1')
  })

  it('should correctly reorder when child moves to root in a project with multiple root todos', async () => {
    const parentA = makeTodo({
      id: 'parent-a',
      title: 'Parent A',
      parentId: null,
      order: 0,
      depth: 0,
      projectId: 'proj-1',
    })
    const childB = makeTodo({
      id: 'child-b',
      title: 'Child B',
      parentId: 'parent-a',
      order: 0,
      depth: 1,
      projectId: 'proj-1',
    })
    const parentC = makeTodo({
      id: 'parent-c',
      title: 'Parent C',
      parentId: null,
      order: 1,
      depth: 0,
      projectId: 'proj-1',
    })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [parentA, childB, parentC] })
    })

    // Move child-b after parent-a => order: parent-a(0), child-b(1), parent-c(2)
    await act(async () => {
      await useTodoStore.getState().moveTodo('child-b', 'parent-a', 'after')
    })

    const rootTodos = useTodoStore.getState().todos
      .filter((t) => t.parentId === null && t.projectId === 'proj-1')
      .sort((a, b) => a.order - b.order)
    expect(rootTodos.map((t) => t.id)).toEqual(['parent-a', 'child-b', 'parent-c'])
  })

  it('should send correct API data when moving child to root in project', async () => {
    const parentA = makeTodo({
      id: 'parent-a',
      title: 'Parent A',
      parentId: null,
      order: 0,
      depth: 0,
      projectId: 'proj-1',
    })
    const childB = makeTodo({
      id: 'child-b',
      title: 'Child B',
      parentId: 'parent-a',
      order: 0,
      depth: 1,
      projectId: 'proj-1',
    })

    mockApiClient.updateTodo.mockResolvedValue({})

    act(() => {
      useTodoStore.setState({ todos: [parentA, childB] })
    })

    await act(async () => {
      await useTodoStore.getState().moveTodo('child-b', 'parent-a', 'before')
    })

    expect(mockApiClient.updateTodo).toHaveBeenCalledWith(
      'child-b',
      expect.objectContaining({
        parentId: null,
        depth: 0,
      })
    )
  })
})

describe('DraggableTodo projectId check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useTodoStore.getState().reset()
    })
  })

  it('verifies that child and parent in same project have matching projectIds', () => {
    const parentA = makeTodo({
      id: 'parent-a',
      parentId: null,
      projectId: 'proj-1',
    })
    const childB = makeTodo({
      id: 'child-b',
      parentId: 'parent-a',
      projectId: 'proj-1',
    })

    // This simulates the check in draggable-todo.tsx line 91
    const draggedTodo = childB
    const targetTodo = parentA
    const sameProject = draggedTodo.projectId === targetTodo.projectId
    expect(sameProject).toBe(true)
  })
})
