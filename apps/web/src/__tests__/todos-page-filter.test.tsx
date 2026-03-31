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

describe('TodosPage - filterStore integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos = []
    mockProjects = []
    mockExpandedIds.clear()
    useFilterStore.setState({ filterType: 'all', projectId: null })
  })

  it('should show all todos when filterType is "all"', () => {
    mockTodos = [
      makeTodo({ id: 't1', title: 'Task A' }),
      makeTodo({ id: 't2', title: 'Task B' }),
    ]
    useFilterStore.setState({ filterType: 'all', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('Task A')).toBeInTheDocument()
    expect(screen.getByText('Task B')).toBeInTheDocument()
  })

  it('should show header "すべてのタスク" when filterType is "all"', () => {
    useFilterStore.setState({ filterType: 'all', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('すべてのタスク')).toBeInTheDocument()
  })

  it('should filter todos by today when filterType is "today"', () => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Today Task', dueDate: today }),
      makeTodo({ id: 't2', title: 'Tomorrow Task', dueDate: tomorrow }),
      makeTodo({ id: 't3', title: 'No Date Task', dueDate: null }),
    ]
    useFilterStore.setState({ filterType: 'today', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('Today Task')).toBeInTheDocument()
    expect(screen.queryByText('Tomorrow Task')).not.toBeInTheDocument()
    expect(screen.queryByText('No Date Task')).not.toBeInTheDocument()
  })

  it('should show header "今日のタスク" when filterType is "today"', () => {
    useFilterStore.setState({ filterType: 'today', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('今日のタスク')).toBeInTheDocument()
  })

  it('should filter todos by upcoming (today to 7 days) when filterType is "upcoming"', () => {
    const today = new Date().toISOString().split('T')[0]
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    const in10Days = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Today Task', dueDate: today }),
      makeTodo({ id: 't2', title: 'Soon Task', dueDate: in3Days }),
      makeTodo({ id: 't3', title: 'Far Task', dueDate: in10Days }),
      makeTodo({ id: 't4', title: 'No Date', dueDate: null }),
    ]
    useFilterStore.setState({ filterType: 'upcoming', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('Today Task')).toBeInTheDocument()
    expect(screen.getByText('Soon Task')).toBeInTheDocument()
    expect(screen.queryByText('Far Task')).not.toBeInTheDocument()
    expect(screen.queryByText('No Date')).not.toBeInTheDocument()
  })

  it('should show header "近日中のタスク" when filterType is "upcoming"', () => {
    useFilterStore.setState({ filterType: 'upcoming', projectId: null })
    render(<TodosPage />)

    expect(screen.getByText('近日中のタスク')).toBeInTheDocument()
  })

  it('should filter todos by projectId when filterType is "project"', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work' })]
    mockTodos = [
      makeTodo({ id: 't1', title: 'Work Task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal Task', projectId: null }),
      makeTodo({ id: 't3', title: 'Other Task', projectId: 'p2' }),
    ]
    useFilterStore.setState({ filterType: 'project', projectId: 'p1' })
    render(<TodosPage />)

    expect(screen.getByText('Work Task')).toBeInTheDocument()
    expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()
    expect(screen.queryByText('Other Task')).not.toBeInTheDocument()
  })

  it('should show project name as header when filterType is "project"', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work' })]
    useFilterStore.setState({ filterType: 'project', projectId: 'p1' })
    render(<TodosPage />)

    expect(screen.getByText('Work')).toBeInTheDocument()
  })
})
