import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock stores
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockCreateTodo = vi.fn()
const mockExpandedIds = new Set<string>()

let mockProjects: Project[] = []

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: mockExpandedIds,
      toggleComplete: mockToggleComplete,
      toggleExpand: mockToggleExpand,
      createTodo: mockCreateTodo,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: mockProjects,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import { TodoNode } from '@/components/todo/todo-node'

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

describe('TodoNode - project badge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    mockProjects = []
  })

  it('should show project emoji when todo has a projectId', () => {
    mockProjects = [makeProject({ id: 'p1', emoji: '💼', color: '#6366F1' })]
    const todo = makeTodo({ projectId: 'p1' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.getByTestId('project-badge')).toHaveTextContent('💼')
  })

  it('should apply left border color from project', () => {
    mockProjects = [makeProject({ id: 'p1', emoji: '💼', color: '#6366F1' })]
    const todo = makeTodo({ projectId: 'p1' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const row = screen.getByTestId('todo-row')
    // JSDOM normalizes hex colors to rgb
    expect(row.style.borderLeftColor).toBe('rgb(99, 102, 241)')
  })

  it('should not show project badge when todo has no projectId', () => {
    const todo = makeTodo({ projectId: null })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.queryByTestId('project-badge')).not.toBeInTheDocument()
  })

  it('should not show project badge when project is not found', () => {
    mockProjects = []
    const todo = makeTodo({ projectId: 'nonexistent' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.queryByTestId('project-badge')).not.toBeInTheDocument()
  })

  it('should not apply border style when no project', () => {
    const todo = makeTodo({ projectId: null })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const row = screen.getByTestId('todo-row')
    expect(row.style.borderLeftColor).toBe('')
  })
})
