import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Mock the todo store
let mockTodos: Todo[] = []
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector: (state: { todos: Todo[] }) => unknown) => {
    const state = {
      todos: mockTodos,
      fetchTodos: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

// Helper to create a Todo
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

// Helper to get today's ISO string
const todayISO = () => new Date().toISOString()

// Helper to get yesterday's ISO string
const yesterdayISO = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString()
}

// Lazy import to ensure mocks are set up first
const renderPage = async () => {
  const { default: ActivityPage } = await import(
    '@/app/(app)/activity/page'
  )
  return render(<ActivityPage />)
}

describe('ActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos = []
  })

  it('should render the page title', async () => {
    await renderPage()
    expect(screen.getByText('活動ログ')).toBeInTheDocument()
  })

  it('should render a back button', async () => {
    await renderPage()
    expect(screen.getByLabelText('戻る')).toBeInTheDocument()
  })

  it('should display today completed todos', async () => {
    mockTodos = [
      makeTodo({
        id: '1',
        title: 'Buy groceries',
        completed: true,
        updatedAt: todayISO(),
      }),
    ]
    await renderPage()
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('should NOT display yesterday completed todos', async () => {
    mockTodos = [
      makeTodo({
        id: '1',
        title: 'Old task',
        completed: true,
        updatedAt: yesterdayISO(),
      }),
    ]
    await renderPage()
    expect(screen.queryByText('Old task')).not.toBeInTheDocument()
  })

  it('should NOT display uncompleted todos', async () => {
    mockTodos = [
      makeTodo({
        id: '1',
        title: 'Incomplete task',
        completed: false,
        updatedAt: todayISO(),
      }),
    ]
    await renderPage()
    expect(screen.queryByText('Incomplete task')).not.toBeInTheDocument()
  })

  it('should display correct completion count summary', async () => {
    mockTodos = [
      makeTodo({ id: '1', title: 'Task A', completed: true, updatedAt: todayISO() }),
      makeTodo({ id: '2', title: 'Task B', completed: true, updatedAt: todayISO() }),
      makeTodo({ id: '3', title: 'Task C', completed: true, updatedAt: todayISO() }),
    ]
    await renderPage()
    expect(screen.getByText(/今日の完了: 3件/)).toBeInTheDocument()
  })

  it('should display empty state when no todos completed today', async () => {
    mockTodos = []
    await renderPage()
    expect(
      screen.getByText('今日の完了タスクはまだありません')
    ).toBeInTheDocument()
  })

  it('should display todo titles in the list', async () => {
    mockTodos = [
      makeTodo({ id: '1', title: 'Write tests', completed: true, updatedAt: todayISO() }),
      makeTodo({ id: '2', title: 'Implement feature', completed: true, updatedAt: todayISO() }),
    ]
    await renderPage()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('Implement feature')).toBeInTheDocument()
  })

  it('should display category icon when present', async () => {
    mockTodos = [
      makeTodo({
        id: '1',
        title: 'Work task',
        completed: true,
        updatedAt: todayISO(),
        categoryIcon: 'work',
      }),
    ]
    await renderPage()
    expect(screen.getByTestId('category-icon-work')).toBeInTheDocument()
  })

  it('should display priority badge when present', async () => {
    mockTodos = [
      makeTodo({
        id: '1',
        title: 'High priority task',
        completed: true,
        updatedAt: todayISO(),
        priority: 'high',
      }),
    ]
    await renderPage()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('should display check mark icon for completed items', async () => {
    mockTodos = [
      makeTodo({ id: '1', title: 'Done task', completed: true, updatedAt: todayISO() }),
    ]
    await renderPage()
    expect(screen.getByTestId('check-icon-1')).toBeInTheDocument()
  })

  it('should filter mixed todos correctly (only today + completed)', async () => {
    mockTodos = [
      makeTodo({ id: '1', title: 'Today done', completed: true, updatedAt: todayISO() }),
      makeTodo({ id: '2', title: 'Today undone', completed: false, updatedAt: todayISO() }),
      makeTodo({ id: '3', title: 'Yesterday done', completed: true, updatedAt: yesterdayISO() }),
      makeTodo({ id: '4', title: 'Yesterday undone', completed: false, updatedAt: yesterdayISO() }),
    ]
    await renderPage()
    expect(screen.getByText('Today done')).toBeInTheDocument()
    expect(screen.queryByText('Today undone')).not.toBeInTheDocument()
    expect(screen.queryByText('Yesterday done')).not.toBeInTheDocument()
    expect(screen.queryByText('Yesterday undone')).not.toBeInTheDocument()
    expect(screen.getByText(/今日の完了: 1件/)).toBeInTheDocument()
  })

  it('should show summary card with indigo styling', async () => {
    mockTodos = [
      makeTodo({ id: '1', title: 'Task', completed: true, updatedAt: todayISO() }),
    ]
    await renderPage()
    const summaryCard = screen.getByTestId('summary-card')
    expect(summaryCard).toBeInTheDocument()
  })

  it('should not show summary card when zero completed', async () => {
    mockTodos = []
    await renderPage()
    expect(screen.queryByTestId('summary-card')).not.toBeInTheDocument()
  })
})
