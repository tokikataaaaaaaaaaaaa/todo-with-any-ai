import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'
import { useFilterStore } from '@/stores/filter-store'

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
  description: null,
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
  emoji: '\u{1F4BC}',
  order: 0,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('TodosPage - project filter (via filterStore)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos = []
    mockProjects = []
    mockExpandedIds.clear()
    useFilterStore.setState({ filterType: 'all', projectId: null })
  })

  it('should show all todos when filterType is "all"', () => {
    mockProjects = [makeProject()]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'proj-1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
    ]
    useFilterStore.setState({ filterType: 'all', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.getByText('Personal Task')).toBeInTheDocument()
  })

  it('should filter todos by project when filterType is "project"', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work', emoji: '\u{1F4BC}' })]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
    ]
    useFilterStore.setState({ filterType: 'project', projectId: 'p1' })
    render(<TodosPage />)

    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()
  })

  it('should show all todos again when switching back to "all"', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work', emoji: '\u{1F4BC}' })]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
    ]

    // First filter by project
    useFilterStore.setState({ filterType: 'project', projectId: 'p1' })
    const { unmount } = render(<TodosPage />)
    expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()
    unmount()

    // Switch back to all
    useFilterStore.setState({ filterType: 'all', projectId: null })
    render(<TodosPage />)
    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.getByText('Personal Task')).toBeInTheDocument()
  })

  it('should not show project filter tabs in page (moved to sidebar)', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work', emoji: '\u{1F4BC}' })]
    mockTodos = [makeTodo()]
    render(<TodosPage />)

    // The inline filter tabs have been removed in favor of the sidebar
    expect(screen.queryByTestId('filter-all')).not.toBeInTheDocument()
    expect(screen.queryByTestId('filter-p1')).not.toBeInTheDocument()
  })
})
