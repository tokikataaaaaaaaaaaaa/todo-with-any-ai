import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockTodos: Todo[] = []
const mockProjects: Project[] = []

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = {
      todos: mockTodos,
      fetchTodos: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = {
      projects: mockProjects,
      fetchProjects: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import CalendarPage from '@/app/(app)/calendar/page'

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-1',
  title: 'Test Todo',
  completed: false,
  dueDate: null,
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

describe('CalendarPage - Todo Display (SDD-004-FE-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos.length = 0
    mockProjects.length = 0
  })

  it('should display a todo with dueDate on the correct day cell', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockTodos.push(makeTodo({ id: 't1', title: 'Buy groceries', dueDate }))

    render(<CalendarPage />)

    const cell = screen.getByTestId(`day-cell-${y}-${m}-15`)
    expect(cell).toHaveTextContent('Buy groceries')
  })

  it('should not display todos without dueDate on the calendar', () => {
    mockTodos.push(makeTodo({ id: 't1', title: 'No date todo', dueDate: null }))

    render(<CalendarPage />)

    expect(screen.queryByText('No date todo')).not.toBeInTheDocument()
  })

  it('should display multiple todos on the same day', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-10`

    mockTodos.push(
      makeTodo({ id: 't1', title: 'Task A', dueDate }),
      makeTodo({ id: 't2', title: 'Task B', dueDate }),
    )

    render(<CalendarPage />)

    const cell = screen.getByTestId(`day-cell-${y}-${m}-10`)
    expect(cell).toHaveTextContent('Task A')
    expect(cell).toHaveTextContent('Task B')
  })

  it('should show "+N" overflow when more than 3 todos on a day', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-20`

    mockTodos.push(
      makeTodo({ id: 't1', title: 'Task 1', dueDate }),
      makeTodo({ id: 't2', title: 'Task 2', dueDate }),
      makeTodo({ id: 't3', title: 'Task 3', dueDate }),
      makeTodo({ id: 't4', title: 'Task 4', dueDate }),
      makeTodo({ id: 't5', title: 'Task 5', dueDate }),
    )

    render(<CalendarPage />)

    const cell = screen.getByTestId(`day-cell-${y}-${m}-20`)
    // Should show first 2 and "+3"
    expect(cell).toHaveTextContent('+3')
  })

  it('should not display todos from a different month', () => {
    const now = new Date()
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    const y = prevMonth.getFullYear()
    const m = String(prevMonth.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockTodos.push(makeTodo({ id: 't1', title: 'Last month task', dueDate }))

    render(<CalendarPage />)

    // The todo title should not be visible in the current month view
    // (it might be on a trailing day cell but not as a badge)
    const currentMonthBadges = screen.queryAllByTestId(/^todo-badge-/)
    const found = currentMonthBadges.some((el) => el.textContent?.includes('Last month task'))
    // This is fine - if the day is a trailing day it might show, otherwise not
    expect(found).toBe(false)
  })

  it('should display completed todos with a strikethrough style', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-12`

    mockTodos.push(makeTodo({ id: 't1', title: 'Done task', dueDate, completed: true }))

    render(<CalendarPage />)

    const badge = screen.getByTestId('todo-badge-t1')
    expect(badge).toHaveAttribute('data-completed', 'true')
  })
})

describe('CalendarPage - Project Colors (SDD-004-FE-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos.length = 0
    mockProjects.length = 0
  })

  it('should apply project color as left border on todo badge', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockProjects.push({
      id: 'proj-1',
      name: 'Work',
      color: '#FF5733',
      emoji: '🏢',
      order: 0,
      dueDate: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })

    mockTodos.push(makeTodo({ id: 't1', title: 'Work task', dueDate, projectId: 'proj-1' }))

    render(<CalendarPage />)

    const badge = screen.getByTestId('todo-badge-t1')
    expect(badge.style.borderLeftColor).toBe('rgb(255, 87, 51)')
  })

  it('should apply default gray border when projectId is null', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockTodos.push(makeTodo({ id: 't1', title: 'No project', dueDate, projectId: null }))

    render(<CalendarPage />)

    const badge = screen.getByTestId('todo-badge-t1')
    expect(badge.style.borderLeftColor).toBe('rgb(156, 163, 175)')
  })
})
