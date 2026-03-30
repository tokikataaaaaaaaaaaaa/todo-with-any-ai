import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock stores
const mockFetchTodos = vi.fn()
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockCreateTodo = vi.fn()
const mockFetchProjects = vi.fn()

let mockTodos: Todo[] = []
let mockLoading = false
let mockError: string | null = null
const mockExpandedIds = new Set<string>()

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      todos: mockTodos,
      loading: mockLoading,
      error: mockError,
      expandedIds: mockExpandedIds,
      fetchTodos: mockFetchTodos,
      createTodo: mockCreateTodo,
      toggleComplete: mockToggleComplete,
      toggleExpand: mockToggleExpand,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: [],
      fetchProjects: mockFetchProjects,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import TodosPage from '@/app/(app)/todos/page'

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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('TodosPage - due date sort', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos = [makeTodo()]
    mockLoading = false
    mockError = null
    mockExpandedIds.clear()
  })

  it('should render the default sort button', () => {
    render(<TodosPage />)
    expect(screen.getByTestId('sort-default')).toBeInTheDocument()
  })

  it('should render the due date sort button', () => {
    render(<TodosPage />)
    expect(screen.getByTestId('sort-dueDate')).toBeInTheDocument()
  })

  it('should have default sort active on initial render', () => {
    render(<TodosPage />)
    const defaultBtn = screen.getByTestId('sort-default')
    const dueDateBtn = screen.getByTestId('sort-dueDate')
    expect(defaultBtn).toHaveAttribute('data-active', 'true')
    expect(dueDateBtn).toHaveAttribute('data-active', 'false')
  })

  it('should call fetchTodos with sort=dueDate when due date button is clicked', () => {
    render(<TodosPage />)
    mockFetchTodos.mockClear()

    const dueDateBtn = screen.getByTestId('sort-dueDate')
    fireEvent.click(dueDateBtn)

    expect(mockFetchTodos).toHaveBeenCalledWith({ sort: 'dueDate' })
  })

  it('should call fetchTodos without sort when default button is clicked after due date', () => {
    render(<TodosPage />)

    // First click due date
    fireEvent.click(screen.getByTestId('sort-dueDate'))
    mockFetchTodos.mockClear()

    // Then click default
    fireEvent.click(screen.getByTestId('sort-default'))

    expect(mockFetchTodos).toHaveBeenCalledWith()
  })

  it('should toggle active state when switching sort modes', () => {
    render(<TodosPage />)

    const defaultBtn = screen.getByTestId('sort-default')
    const dueDateBtn = screen.getByTestId('sort-dueDate')

    // Click due date
    fireEvent.click(dueDateBtn)
    expect(dueDateBtn).toHaveAttribute('data-active', 'true')
    expect(defaultBtn).toHaveAttribute('data-active', 'false')

    // Click default again
    fireEvent.click(defaultBtn)
    expect(defaultBtn).toHaveAttribute('data-active', 'true')
    expect(dueDateBtn).toHaveAttribute('data-active', 'false')
  })

  it('should not re-fetch when clicking the already active sort button (default)', () => {
    render(<TodosPage />)
    // Initial fetch happens in useEffect
    mockFetchTodos.mockClear()

    // Click default which is already active
    fireEvent.click(screen.getByTestId('sort-default'))
    expect(mockFetchTodos).not.toHaveBeenCalled()
  })

  it('should not re-fetch when clicking the already active sort button (dueDate)', () => {
    render(<TodosPage />)

    // Switch to dueDate
    fireEvent.click(screen.getByTestId('sort-dueDate'))
    mockFetchTodos.mockClear()

    // Click dueDate again
    fireEvent.click(screen.getByTestId('sort-dueDate'))
    expect(mockFetchTodos).not.toHaveBeenCalled()
  })

  it('should display sort buttons with correct labels', () => {
    render(<TodosPage />)
    expect(screen.getByTestId('sort-default')).toHaveTextContent('デフォルト順')
    expect(screen.getByTestId('sort-dueDate')).toHaveTextContent('期限順')
  })

  it('should call fetchTodos without arguments on initial mount (default sort)', () => {
    render(<TodosPage />)
    // The initial useEffect calls fetchTodos()
    expect(mockFetchTodos).toHaveBeenCalledWith()
  })
})
