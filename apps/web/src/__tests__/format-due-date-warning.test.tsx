import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoNode } from '@/components/todo/todo-node'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock the todo store
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: new Set<string>(),
      toggleComplete: vi.fn(),
      toggleExpand: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: [],
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

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
  projectId: null,
  urgencyLevelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('formatDueDate - 24h warning (amber)', () => {
  it('should show warning styling for due date that is today (within 24h)', () => {
    const today = new Date()
    today.setHours(23, 59, 59)
    const todo = makeTodo({
      title: 'Due Today Task',
      dueDate: today.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    // "Today" label should be shown with warning styling
    const dueDateElements = screen.getAllByText(/today/i)
    const dueDateSpan = dueDateElements.find((el) => el.tagName === 'SPAN')
    expect(dueDateSpan).toBeDefined()
    expect(dueDateSpan!.className).toMatch(/warning/)
  })

  it('should show warning styling for due date that is tomorrow (within 24h)', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todo = makeTodo({
      title: 'Due Tomorrow Task',
      dueDate: tomorrow.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const dueDateElements = screen.getAllByText(/tomorrow/i)
    const dueDateSpan = dueDateElements.find((el) => el.tagName === 'SPAN')
    expect(dueDateSpan).toBeDefined()
    expect(dueDateSpan!.className).toMatch(/warning/)
  })

  it('should show default styling for due date more than 2 days away', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const todo = makeTodo({
      title: 'Future Task',
      dueDate: future.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const dueDateSpan = screen.getByText(/5d/)
    expect(dueDateSpan.className).toMatch(/text-secondary/)
    expect(dueDateSpan.className).not.toMatch(/warning|error/)
  })

  it('should show error styling for overdue dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 2)
    const todo = makeTodo({
      title: 'Overdue Task',
      dueDate: yesterday.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const dueDateElements = screen.getAllByText(/overdue/i)
    const dueDateSpan = dueDateElements.find((el) => el.tagName === 'SPAN')
    expect(dueDateSpan).toBeDefined()
    expect(dueDateSpan!.className).toMatch(/error/)
  })
})
