import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock stores
const mockFetchTodos = vi.fn()
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockCreateTodo = vi.fn()
const mockFetchProjects = vi.fn()

let mockTodos: Todo[] = []
let mockProjects: Project[] = []
const mockExpandedIds = new Set<string>()

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      todos: mockTodos,
      loading: false,
      error: null,
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
      projects: mockProjects,
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
  projectId: null,
  urgencyLevelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Work',
  color: '#6366F1',
  emoji: '💼',
  order: 0,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('TodosPage - project filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos = []
    mockProjects = []
    mockExpandedIds.clear()
  })

  it('should render "全て" filter tab', () => {
    mockProjects = [makeProject()]
    mockTodos = [makeTodo()]
    render(<TodosPage />)
    expect(screen.getByTestId('filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-all')).toHaveTextContent('全て')
  })

  it('should render project filter tabs', () => {
    mockProjects = [
      makeProject({ id: 'p1', name: 'Work', emoji: '💼' }),
      makeProject({ id: 'p2', name: 'Personal', emoji: '🏠' }),
    ]
    mockTodos = [makeTodo()]
    render(<TodosPage />)
    expect(screen.getByTestId('filter-p1')).toHaveTextContent('💼 Work')
    expect(screen.getByTestId('filter-p2')).toHaveTextContent('🏠 Personal')
  })

  it('should show all todos when "全て" is selected', () => {
    mockProjects = [makeProject({ id: 'p1' })]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
    ]
    render(<TodosPage />)

    // By default "全て" is selected - both todos should be visible
    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.getByText('Personal Task')).toBeInTheDocument()
  })

  it('should filter todos when a project tab is clicked', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work', emoji: '💼' })]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
    ]
    render(<TodosPage />)

    const filterTab = screen.getByTestId('filter-p1')
    fireEvent.click(filterTab)

    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()
  })

  it('should show all todos again when clicking "全て" after filtering', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work', emoji: '💼' })]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
    ]
    render(<TodosPage />)

    // Filter by project
    const filterTab = screen.getByTestId('filter-p1')
    fireEvent.click(filterTab)
    expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()

    // Click "All"
    const allTab = screen.getByTestId('filter-all')
    fireEvent.click(allTab)
    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.getByText('Personal Task')).toBeInTheDocument()
  })

  it('should highlight the active filter tab', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work', emoji: '💼' })]
    mockTodos = [makeTodo({ id: 't1', projectId: 'p1' })]
    render(<TodosPage />)

    const allTab = screen.getByTestId('filter-all')
    expect(allTab).toHaveAttribute('data-active', 'true')

    const projectTab = screen.getByTestId('filter-p1')
    fireEvent.click(projectTab)
    expect(projectTab).toHaveAttribute('data-active', 'true')
    expect(allTab).toHaveAttribute('data-active', 'false')
  })

  it('should not show filter tabs when no projects exist', () => {
    mockProjects = []
    mockTodos = [makeTodo()]
    render(<TodosPage />)
    expect(screen.queryByTestId('filter-all')).not.toBeInTheDocument()
  })
})
