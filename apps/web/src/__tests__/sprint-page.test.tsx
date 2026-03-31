import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Sprint, Todo } from '@todo-with-any-ai/shared'

// Mock sprint store
const mockFetchSprints = vi.fn()
const mockCreateSprint = vi.fn()
const mockDeleteSprint = vi.fn()
const mockAddTodoToSprint = vi.fn()
const mockRemoveTodoFromSprint = vi.fn()

let mockSprintStoreState = {
  sprints: [] as Sprint[],
  loading: false,
  error: null as string | null,
  fetchSprints: mockFetchSprints,
  createSprint: mockCreateSprint,
  deleteSprint: mockDeleteSprint,
  addTodoToSprint: mockAddTodoToSprint,
  removeTodoFromSprint: mockRemoveTodoFromSprint,
  reset: vi.fn(),
}

vi.mock('@/stores/sprint-store', () => ({
  useSprintStore: vi.fn((selector) => {
    return typeof selector === 'function' ? selector(mockSprintStoreState) : mockSprintStoreState
  }),
}))

// Mock todo store
const mockFetchTodos = vi.fn()
const mockToggleComplete = vi.fn()

let mockTodoStoreState = {
  todos: [] as Todo[],
  loading: false,
  error: null as string | null,
  fetchTodos: mockFetchTodos,
  toggleComplete: mockToggleComplete,
}

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    return typeof selector === 'function' ? selector(mockTodoStoreState) : mockTodoStoreState
  }),
}))

// Mock project store
vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = { projects: [], loading: false, error: null, fetchProjects: vi.fn(), createProject: vi.fn(), updateProject: vi.fn(), deleteProject: vi.fn(), reset: vi.fn() }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import SprintsPage from '@/app/(app)/sprints/page'

const makeSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: 'sprint-1',
  name: 'Week 14',
  startDate: '2026-03-30',
  endDate: '2026-04-06',
  todoIds: [],
  createdAt: '2026-03-30T00:00:00Z',
  updatedAt: '2026-03-30T00:00:00Z',
  ...overrides,
})

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

describe('SprintsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSprintStoreState = {
      sprints: [],
      loading: false,
      error: null,
      fetchSprints: mockFetchSprints,
      createSprint: mockCreateSprint,
      deleteSprint: mockDeleteSprint,
      addTodoToSprint: mockAddTodoToSprint,
      removeTodoFromSprint: mockRemoveTodoFromSprint,
      reset: vi.fn(),
    }
    mockTodoStoreState = {
      todos: [],
      loading: false,
      error: null,
      fetchTodos: mockFetchTodos,
      toggleComplete: mockToggleComplete,
    }
  })

  it('should render page title', () => {
    render(<SprintsPage />)
    expect(screen.getByText('Sprints')).toBeInTheDocument()
  })

  it('should call fetchSprints on mount', () => {
    render(<SprintsPage />)
    expect(mockFetchSprints).toHaveBeenCalled()
  })

  it('should show loading state when loading', () => {
    mockSprintStoreState.loading = true
    render(<SprintsPage />)
    expect(screen.getByTestId('sprint-skeleton')).toBeInTheDocument()
  })

  it('should show error message when error', () => {
    mockSprintStoreState.error = 'Failed to load sprints'
    render(<SprintsPage />)
    expect(screen.getByText('Failed to load sprints')).toBeInTheDocument()
  })

  it('should show empty state when no sprints', () => {
    render(<SprintsPage />)
    expect(screen.getByTestId('sprint-empty-state')).toBeInTheDocument()
  })

  it('should show create sprint button', () => {
    render(<SprintsPage />)
    expect(screen.getByTestId('create-sprint-button')).toBeInTheDocument()
  })

  it('should display sprint name when sprints exist', () => {
    mockSprintStoreState.sprints = [makeSprint({ name: 'Week 14' })]
    render(<SprintsPage />)
    expect(screen.getByText('Week 14')).toBeInTheDocument()
  })

  it('should display sprint date range', () => {
    mockSprintStoreState.sprints = [makeSprint()]
    render(<SprintsPage />)
    expect(screen.getByTestId('sprint-dates-sprint-1')).toBeInTheDocument()
  })

  it('should show progress bar with correct percentage', () => {
    const todos = [
      makeTodo({ id: 'todo-1', completed: true }),
      makeTodo({ id: 'todo-2', completed: false }),
    ]
    mockTodoStoreState.todos = todos
    mockSprintStoreState.sprints = [makeSprint({ todoIds: ['todo-1', 'todo-2'] })]
    render(<SprintsPage />)

    const progressBar = screen.getByTestId('sprint-progress-sprint-1')
    expect(progressBar).toBeInTheDocument()
    expect(screen.getByTestId('sprint-progress-text-sprint-1')).toHaveTextContent('1 / 2')
  })

  it('should show 0% when no todos in sprint', () => {
    mockSprintStoreState.sprints = [makeSprint({ todoIds: [] })]
    render(<SprintsPage />)
    expect(screen.getByTestId('sprint-progress-text-sprint-1')).toHaveTextContent('0 / 0')
  })

  it('should open create dialog when create button is clicked', () => {
    render(<SprintsPage />)
    fireEvent.click(screen.getByTestId('create-sprint-button'))
    expect(screen.getByTestId('sprint-create-dialog')).toBeInTheDocument()
  })

  it('should show period preset buttons in create dialog', () => {
    render(<SprintsPage />)
    fireEvent.click(screen.getByTestId('create-sprint-button'))
    expect(screen.getByTestId('period-1week')).toBeInTheDocument()
    expect(screen.getByTestId('period-2weeks')).toBeInTheDocument()
    expect(screen.getByTestId('period-1month')).toBeInTheDocument()
    expect(screen.getByTestId('period-custom')).toBeInTheDocument()
  })
})
