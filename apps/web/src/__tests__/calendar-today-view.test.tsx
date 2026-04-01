import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

function getTodayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

describe('CalendarPage - Today View Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos.length = 0
    mockProjects.length = 0
  })

  it('should render tab bar with "月ビュー" and "本日ビュー" tabs', () => {
    render(<CalendarPage />)

    expect(screen.getByTestId('tab-month-view')).toBeInTheDocument()
    expect(screen.getByTestId('tab-today-view')).toBeInTheDocument()
  })

  it('should show "月ビュー" tab as active by default', () => {
    render(<CalendarPage />)

    const monthTab = screen.getByTestId('tab-month-view')
    expect(monthTab).toHaveAttribute('data-active', 'true')

    const todayTab = screen.getByTestId('tab-today-view')
    expect(todayTab).toHaveAttribute('data-active', 'false')
  })

  it('should show calendar grid in month view by default', () => {
    render(<CalendarPage />)

    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('today-view')).not.toBeInTheDocument()
  })

  it('should switch to today view when "本日ビュー" tab is clicked', () => {
    render(<CalendarPage />)

    fireEvent.click(screen.getByTestId('tab-today-view'))

    expect(screen.getByTestId('today-view')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument()
  })

  it('should show "本日ビュー" tab as active after clicking it', () => {
    render(<CalendarPage />)

    fireEvent.click(screen.getByTestId('tab-today-view'))

    expect(screen.getByTestId('tab-today-view')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('tab-month-view')).toHaveAttribute('data-active', 'false')
  })

  it('should switch back to month view when "月ビュー" tab is clicked', () => {
    render(<CalendarPage />)

    fireEvent.click(screen.getByTestId('tab-today-view'))
    fireEvent.click(screen.getByTestId('tab-month-view'))

    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('today-view')).not.toBeInTheDocument()
  })

  it('should display today\'s todos in today view', () => {
    const todayStr = getTodayStr()
    mockTodos.push(
      makeTodo({ id: 'todo-today-1', title: '今日のタスク1', dueDate: todayStr }),
      makeTodo({ id: 'todo-today-2', title: '今日のタスク2', dueDate: todayStr }),
    )

    render(<CalendarPage />)
    fireEvent.click(screen.getByTestId('tab-today-view'))

    expect(screen.getByTestId('today-todo-todo-today-1')).toBeInTheDocument()
    expect(screen.getByTestId('today-todo-todo-today-2')).toBeInTheDocument()
  })

  it('should not display todos from other days in today view', () => {
    const todayStr = getTodayStr()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    mockTodos.push(
      makeTodo({ id: 'todo-today', title: '今日のタスク', dueDate: todayStr }),
      makeTodo({ id: 'todo-tomorrow', title: '明日のタスク', dueDate: tomorrowStr }),
    )

    render(<CalendarPage />)
    fireEvent.click(screen.getByTestId('tab-today-view'))

    expect(screen.getByTestId('today-todo-todo-today')).toBeInTheDocument()
    expect(screen.queryByTestId('today-todo-todo-tomorrow')).not.toBeInTheDocument()
  })

  it('should show empty state message when no todos today', () => {
    render(<CalendarPage />)
    fireEvent.click(screen.getByTestId('tab-today-view'))

    expect(screen.getByTestId('today-view-empty')).toBeInTheDocument()
  })

  it('should not show empty state when there are todos today', () => {
    const todayStr = getTodayStr()
    mockTodos.push(makeTodo({ id: 'todo-1', title: '今日のタスク', dueDate: todayStr }))

    render(<CalendarPage />)
    fireEvent.click(screen.getByTestId('tab-today-view'))

    expect(screen.queryByTestId('today-view-empty')).not.toBeInTheDocument()
  })

  it('should link today\'s todo items to detail page', () => {
    const todayStr = getTodayStr()
    mockTodos.push(makeTodo({ id: 'todo-link', title: 'リンクテスト', dueDate: todayStr }))

    render(<CalendarPage />)
    fireEvent.click(screen.getByTestId('tab-today-view'))

    const todoItem = screen.getByTestId('today-todo-todo-link')
    const link = todoItem.closest('a') ?? todoItem.querySelector('a')
    expect(link).toHaveAttribute('href', '/todos/detail?id=todo-link')
  })

  it('should show completed todos with strikethrough in today view', () => {
    const todayStr = getTodayStr()
    mockTodos.push(makeTodo({ id: 'todo-done', title: '完了タスク', dueDate: todayStr, completed: true }))

    render(<CalendarPage />)
    fireEvent.click(screen.getByTestId('tab-today-view'))

    const todoItem = screen.getByTestId('today-todo-todo-done')
    expect(todoItem).toHaveAttribute('data-completed', 'true')
  })
})
