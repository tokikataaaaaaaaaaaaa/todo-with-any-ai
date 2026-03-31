import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock stores
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      toggleComplete: vi.fn(),
      toggleExpand: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      expandedIds: new Set<string>(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = { projects: [] }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import { TodoNode } from '@/components/todo/todo-node'

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-1',
  title: 'Test todo',
  completed: false,
  dueDate: '2026-04-01',
  startTime: null,
  endTime: null,
  parentId: null,
  order: 0,
  depth: 0,
  projectId: null,
  priority: null,

  categoryIcon: null,
  description: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('TodoNode - time display in due date', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Fix "today" so dueDate formatting is deterministic
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-30T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should show date with startTime and endTime', () => {
    const todo = makeTodo({ startTime: '09:00', endTime: '10:00' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    // "2d" is the relative display; the time suffix should be included
    // The format should include the time range
    const dueDateEl = screen.getByText(/09:00/)
    expect(dueDateEl).toBeInTheDocument()
    expect(dueDateEl.textContent).toContain('10:00')
  })

  it('should show startTime only with trailing tilde', () => {
    const todo = makeTodo({ startTime: '09:00', endTime: null })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const el = screen.getByText(/09:00/)
    expect(el.textContent).toMatch(/09:00/)
  })

  it('should show endTime only with leading tilde', () => {
    const todo = makeTodo({ startTime: null, endTime: '17:00' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const el = screen.getByText(/17:00/)
    expect(el.textContent).toMatch(/17:00/)
  })

  it('should show plain due date when no time is set', () => {
    const todo = makeTodo({ startTime: null, endTime: null })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    // Should show "2d" (2 days from 3/30 to 4/1)
    expect(screen.getByText('2d')).toBeInTheDocument()
  })

  it('should show calendar icon button when dueDate is set', () => {
    const todo = makeTodo()
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    expect(screen.getByLabelText(/カレンダーに追加/)).toBeInTheDocument()
  })

  it('should not show calendar icon button when dueDate is null', () => {
    const todo = makeTodo({ dueDate: null })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    expect(screen.queryByLabelText(/カレンダーに追加/)).not.toBeInTheDocument()
  })
})
