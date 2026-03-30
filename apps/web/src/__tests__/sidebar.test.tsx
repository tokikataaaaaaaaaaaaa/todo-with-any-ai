import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'
import { useFilterStore } from '@/stores/filter-store'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/todos',
}))

// Mock store data
let mockTodos: Todo[] = []
let mockProjects: Project[] = []
const mockFetchProjects = vi.fn()

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      todos: mockTodos,
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

import { Sidebar } from '@/components/layout/sidebar'

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
  emoji: '💼',
  order: 0,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('Sidebar', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos = []
    mockProjects = []
    useFilterStore.setState({ filterType: 'all', projectId: null })
  })

  it('should render three filter items: all, today, upcoming', () => {
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-today')).toBeInTheDocument()
    expect(screen.getByTestId('filter-upcoming')).toBeInTheDocument()
  })

  it('should display filter labels in Japanese', () => {
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-all')).toHaveTextContent('すべて')
    expect(screen.getByTestId('filter-today')).toHaveTextContent('今日')
    expect(screen.getByTestId('filter-upcoming')).toHaveTextContent('近日中')
  })

  it('should display total todo count for "all" filter', () => {
    mockTodos = [
      makeTodo({ id: 't1', completed: false }),
      makeTodo({ id: 't2', completed: false }),
      makeTodo({ id: 't3', completed: true }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    // Count shows incomplete todos only
    expect(screen.getByTestId('filter-all-count')).toHaveTextContent('2')
  })

  it('should display today todo count', () => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    mockTodos = [
      makeTodo({ id: 't1', dueDate: today, completed: false }),
      makeTodo({ id: 't2', dueDate: today, completed: false }),
      makeTodo({ id: 't3', dueDate: tomorrow, completed: false }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-today-count')).toHaveTextContent('2')
  })

  it('should display upcoming todo count (today to 7 days)', () => {
    const today = new Date().toISOString().split('T')[0]
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    const in10Days = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
    mockTodos = [
      makeTodo({ id: 't1', dueDate: today, completed: false }),
      makeTodo({ id: 't2', dueDate: in3Days, completed: false }),
      makeTodo({ id: 't3', dueDate: in10Days, completed: false }),
      makeTodo({ id: 't4', dueDate: null, completed: false }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-upcoming-count')).toHaveTextContent('2')
  })

  it('should display project list with color dots', () => {
    mockProjects = [
      makeProject({ id: 'p1', name: 'Work', color: '#6366F1' }),
      makeProject({ id: 'p2', name: 'Personal', color: '#10B981' }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('project-p1')).toBeInTheDocument()
    expect(screen.getByTestId('project-p2')).toBeInTheDocument()
    // Both desktop and mobile sidebars render project names
    expect(screen.getAllByText('Work').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Personal').length).toBeGreaterThanOrEqual(1)

    // Color dots (mobile sidebar, non-prefixed testId)
    const dot1 = screen.getByTestId('project-dot-p1')
    expect(dot1).toHaveStyle({ backgroundColor: '#6366F1' })
    const dot2 = screen.getByTestId('project-dot-p2')
    expect(dot2).toHaveStyle({ backgroundColor: '#10B981' })
  })

  it('should display incomplete todo count per project', () => {
    mockProjects = [
      makeProject({ id: 'p1', name: 'Work' }),
    ]
    mockTodos = [
      makeTodo({ id: 't1', projectId: 'p1', completed: false }),
      makeTodo({ id: 't2', projectId: 'p1', completed: true }),
      makeTodo({ id: 't3', projectId: 'p1', completed: false }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('project-count-p1')).toHaveTextContent('2')
  })

  it('should update filterStore when clicking "all" filter', () => {
    useFilterStore.setState({ filterType: 'today', projectId: null })
    render(<Sidebar open={true} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('filter-all'))

    const state = useFilterStore.getState()
    expect(state.filterType).toBe('all')
    expect(state.projectId).toBeNull()
  })

  it('should update filterStore when clicking "today" filter', () => {
    render(<Sidebar open={true} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('filter-today'))

    const state = useFilterStore.getState()
    expect(state.filterType).toBe('today')
  })

  it('should update filterStore when clicking "upcoming" filter', () => {
    render(<Sidebar open={true} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('filter-upcoming'))

    const state = useFilterStore.getState()
    expect(state.filterType).toBe('upcoming')
  })

  it('should update filterStore when clicking a project', () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work' })]
    render(<Sidebar open={true} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('project-p1'))

    const state = useFilterStore.getState()
    expect(state.filterType).toBe('project')
    expect(state.projectId).toBe('p1')
  })

  it('should show active state for selected filter', () => {
    useFilterStore.setState({ filterType: 'today', projectId: null })
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-today')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('filter-all')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('filter-upcoming')).toHaveAttribute('data-active', 'false')
  })

  it('should show active state for selected project', () => {
    mockProjects = [
      makeProject({ id: 'p1', name: 'Work' }),
      makeProject({ id: 'p2', name: 'Personal' }),
    ]
    useFilterStore.setState({ filterType: 'project', projectId: 'p1' })
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('project-p1')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('project-p2')).toHaveAttribute('data-active', 'false')
  })

  it('should display PROJECTS section label', () => {
    render(<Sidebar open={true} onClose={onClose} />)
    // Both desktop and mobile sidebars render, so use getAllByText
    const labels = screen.getAllByText('PROJECTS')
    expect(labels.length).toBeGreaterThanOrEqual(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    render(<Sidebar open={true} onClose={onClose} />)

    const backdrop = screen.getByTestId('sidebar-backdrop')
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not render backdrop when open is false', () => {
    render(<Sidebar open={false} onClose={onClose} />)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('should render "add project" link', () => {
    render(<Sidebar open={true} onClose={onClose} />)
    expect(screen.getByTestId('add-project-link')).toBeInTheDocument()
  })

  it('should not count completed todos in today filter', () => {
    const today = new Date().toISOString().split('T')[0]
    mockTodos = [
      makeTodo({ id: 't1', dueDate: today, completed: false }),
      makeTodo({ id: 't2', dueDate: today, completed: true }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-today-count')).toHaveTextContent('1')
  })

  it('should not count completed todos in upcoming filter', () => {
    const today = new Date().toISOString().split('T')[0]
    mockTodos = [
      makeTodo({ id: 't1', dueDate: today, completed: false }),
      makeTodo({ id: 't2', dueDate: today, completed: true }),
    ]
    render(<Sidebar open={true} onClose={onClose} />)

    expect(screen.getByTestId('filter-upcoming-count')).toHaveTextContent('1')
  })
})
