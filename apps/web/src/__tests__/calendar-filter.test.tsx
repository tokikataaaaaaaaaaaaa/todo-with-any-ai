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
  urgencyLevelId: null,
  categoryIcon: null,
  description: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Work',
  color: '#FF5733',
  emoji: '🏢',
  order: 0,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('CalendarPage - Project Filter (SDD-004-FE-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos.length = 0
    mockProjects.length = 0
  })

  it('should render an "All" filter chip', () => {
    render(<CalendarPage />)

    expect(screen.getByTestId('filter-chip-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-chip-all')).toHaveTextContent('All')
  })

  it('should render filter chips for each project', () => {
    mockProjects.push(
      makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }),
      makeProject({ id: 'p2', name: 'Personal', emoji: '🏠' }),
    )

    render(<CalendarPage />)

    expect(screen.getByTestId('filter-chip-p1')).toBeInTheDocument()
    expect(screen.getByTestId('filter-chip-p2')).toBeInTheDocument()
    expect(screen.getByTestId('filter-chip-p1')).toHaveTextContent('🏢')
    expect(screen.getByTestId('filter-chip-p2')).toHaveTextContent('🏠')
  })

  it('should have "All" chip active by default', () => {
    render(<CalendarPage />)

    expect(screen.getByTestId('filter-chip-all')).toHaveAttribute('data-active', 'true')
  })

  it('should toggle a project chip off and hide its todos', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockProjects.push(makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }))
    mockTodos.push(makeTodo({ id: 't1', title: 'Work task', dueDate, projectId: 'p1' }))

    render(<CalendarPage />)

    // Initially visible
    expect(screen.getByTestId('todo-badge-t1')).toBeInTheDocument()

    // Click All chip to deactivate, then toggle p1 off
    // Actually: click on the project chip to toggle it off
    fireEvent.click(screen.getByTestId('filter-chip-p1'))

    // After toggling off, the todo should be hidden
    expect(screen.queryByTestId('todo-badge-t1')).not.toBeInTheDocument()
  })

  it('should toggle a project chip back on to show its todos again', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockProjects.push(makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }))
    mockTodos.push(makeTodo({ id: 't1', title: 'Work task', dueDate, projectId: 'p1' }))

    render(<CalendarPage />)

    // Toggle off
    fireEvent.click(screen.getByTestId('filter-chip-p1'))
    expect(screen.queryByTestId('todo-badge-t1')).not.toBeInTheDocument()

    // Toggle back on
    fireEvent.click(screen.getByTestId('filter-chip-p1'))
    expect(screen.getByTestId('todo-badge-t1')).toBeInTheDocument()
  })

  it('should show todos from all projects when "All" is active', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockProjects.push(
      makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }),
      makeProject({ id: 'p2', name: 'Personal', emoji: '🏠' }),
    )
    mockTodos.push(
      makeTodo({ id: 't1', title: 'Work task', dueDate, projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Personal task', dueDate, projectId: 'p2' }),
    )

    render(<CalendarPage />)

    expect(screen.getByTestId('todo-badge-t1')).toBeInTheDocument()
    expect(screen.getByTestId('todo-badge-t2')).toBeInTheDocument()
  })

  it('should render the filter chip bar with horizontal scroll', () => {
    render(<CalendarPage />)

    const chipBar = screen.getByTestId('filter-chip-bar')
    expect(chipBar).toBeInTheDocument()
  })

  it('should deactivate "All" when a project chip is toggled off', () => {
    mockProjects.push(makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }))

    render(<CalendarPage />)

    fireEvent.click(screen.getByTestId('filter-chip-p1'))
    expect(screen.getByTestId('filter-chip-all')).toHaveAttribute('data-active', 'false')
  })

  it('should re-activate "All" when all project chips are toggled back on', () => {
    mockProjects.push(makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }))

    render(<CalendarPage />)

    // Toggle off
    fireEvent.click(screen.getByTestId('filter-chip-p1'))
    expect(screen.getByTestId('filter-chip-all')).toHaveAttribute('data-active', 'false')

    // Toggle back on
    fireEvent.click(screen.getByTestId('filter-chip-p1'))
    expect(screen.getByTestId('filter-chip-all')).toHaveAttribute('data-active', 'true')
  })

  it('should reset all filters when "All" chip is clicked', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const dueDate = `${y}-${m}-15`

    mockProjects.push(makeProject({ id: 'p1', name: 'Work', emoji: '🏢' }))
    mockTodos.push(makeTodo({ id: 't1', title: 'Work task', dueDate, projectId: 'p1' }))

    render(<CalendarPage />)

    // Toggle project off
    fireEvent.click(screen.getByTestId('filter-chip-p1'))
    expect(screen.queryByTestId('todo-badge-t1')).not.toBeInTheDocument()

    // Click "All" to reset
    fireEvent.click(screen.getByTestId('filter-chip-all'))
    expect(screen.getByTestId('todo-badge-t1')).toBeInTheDocument()
  })
})
