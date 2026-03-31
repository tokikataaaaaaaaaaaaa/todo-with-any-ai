import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TodosPage from '@/app/(app)/todos/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock the todo store
const mockFetchTodos = vi.fn()
const mockTodos = [
  {
    id: '1',
    title: 'Task A',
    completed: false,
    dueDate: '2026-04-01T00:00:00Z',
    parentId: null,
    order: 0,
    depth: 0,
    priority: null,
    categoryIcon: null,
    description: null,
    projectId: null,

    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Task B',
    completed: false,
    dueDate: '2026-03-20T00:00:00Z',
    parentId: null,
    order: 1,
    depth: 0,
    priority: null,
    categoryIcon: null,
    description: null,
    projectId: null,

    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      todos: mockTodos,
      loading: false,
      error: null,
      fetchTodos: mockFetchTodos,
      expandedIds: new Set<string>(),
      toggleComplete: vi.fn(),
      toggleExpand: vi.fn(),
      createTodo: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: [],
      fetchProjects: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

describe('TodosPage sort UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sort toggle buttons', () => {
    render(<TodosPage />)
    expect(screen.getByRole('button', { name: /default|order|デフォルト/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /due.*date|期限/i })).toBeInTheDocument()
  })

  it('should have default sort selected by default', () => {
    render(<TodosPage />)
    const defaultButton = screen.getByRole('button', { name: /default|order|デフォルト/i })
    // active state
    expect(defaultButton.className).toMatch(/indigo|bg-/)
  })

  it('should switch to due date sort when clicked', () => {
    render(<TodosPage />)
    const dueDateButton = screen.getByRole('button', { name: /due.*date|期限/i })
    fireEvent.click(dueDateButton)
    expect(dueDateButton.className).toMatch(/indigo|bg-/)
  })

  it('should call fetchTodos with sort parameter when due date sort is selected', () => {
    render(<TodosPage />)
    const dueDateButton = screen.getByRole('button', { name: /due.*date|期限/i })
    fireEvent.click(dueDateButton)
    expect(mockFetchTodos).toHaveBeenCalledWith({ sort: 'dueDate' })
  })

  it('should call fetchTodos without sort parameter when default sort is selected', () => {
    render(<TodosPage />)
    const dueDateButton = screen.getByRole('button', { name: /due.*date|期限/i })
    fireEvent.click(dueDateButton)
    mockFetchTodos.mockClear()

    const defaultButton = screen.getByRole('button', { name: /default|order|デフォルト/i })
    fireEvent.click(defaultButton)
    expect(mockFetchTodos).toHaveBeenCalledWith()
  })
})
