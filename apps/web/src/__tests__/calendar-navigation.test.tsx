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

describe('CalendarPage - Navigation to Todo Detail (SDD-004-FE-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos.length = 0
    mockProjects.length = 0
  })

  it('should render todo badges as links to detail page', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockTodos.push(makeTodo({ id: 'todo-abc', title: 'Linked todo', dueDate }))

    render(<CalendarPage />)

    const badge = screen.getByTestId('todo-badge-todo-abc')
    const link = badge.closest('a')
    expect(link).toHaveAttribute('href', '/todos/detail?id=todo-abc')
  })

  it('should have minimum 44px tap target on todo badges', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockTodos.push(makeTodo({ id: 't1', title: 'Tap target', dueDate }))

    render(<CalendarPage />)

    const badge = screen.getByTestId('todo-badge-t1')
    // Check the link wrapper has min-height
    const link = badge.closest('a')
    expect(link).toHaveAttribute('data-min-tap', 'true')
  })

  it('should link each todo badge to its own detail page', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockTodos.push(
      makeTodo({ id: 'todo-1', title: 'First', dueDate }),
      makeTodo({ id: 'todo-2', title: 'Second', dueDate }),
    )

    render(<CalendarPage />)

    const badge1 = screen.getByTestId('todo-badge-todo-1')
    const badge2 = screen.getByTestId('todo-badge-todo-2')
    expect(badge1.closest('a')).toHaveAttribute('href', '/todos/detail?id=todo-1')
    expect(badge2.closest('a')).toHaveAttribute('href', '/todos/detail?id=todo-2')
  })
})
