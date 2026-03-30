import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock stores
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockCreateTodo = vi.fn()
const mockExpandedIds = new Set<string>()

let mockProjects: Project[] = []

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: mockExpandedIds,
      toggleComplete: mockToggleComplete,
      toggleExpand: mockToggleExpand,
      createTodo: mockCreateTodo,
      deleteTodo: vi.fn(),
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

import { ProjectSection } from '@/components/todo/project-section'

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

describe('ProjectSection - project card display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    mockProjects = []
  })

  it('should show project name in header', () => {
    const project = makeProject({ id: 'p1', name: 'Work' })
    const todos = [makeTodo({ id: 't1', projectId: 'p1' })]
    mockProjects = [project]
    render(
      <ProjectSection
        icon={project.emoji}
        name={project.name}
        accentColor={project.color}
        todos={todos}
        allTodos={todos}
        projectId={project.id}
      />
    )
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('should show project emoji icon in header', () => {
    const project = makeProject({ id: 'p1', emoji: '\u{1F4BC}' })
    const todos = [makeTodo({ id: 't1', projectId: 'p1' })]
    mockProjects = [project]
    render(
      <ProjectSection
        icon={project.emoji}
        name={project.name}
        accentColor={project.color}
        todos={todos}
        allTodos={todos}
        projectId={project.id}
      />
    )
    expect(screen.getByText('\u{1F4BC}')).toBeInTheDocument()
  })

  it('should show completion progress', () => {
    const project = makeProject({ id: 'p1' })
    const todos = [
      makeTodo({ id: 't1', projectId: 'p1', completed: true }),
      makeTodo({ id: 't2', projectId: 'p1', completed: false }),
      makeTodo({ id: 't3', projectId: 'p1', completed: false }),
    ]
    mockProjects = [project]
    render(
      <ProjectSection
        icon={project.emoji}
        name={project.name}
        accentColor={project.color}
        todos={todos}
        allTodos={todos}
        projectId={project.id}
      />
    )
    expect(screen.getByTestId('project-progress')).toHaveTextContent('1/3')
  })

  it('should apply left border color from project', () => {
    const project = makeProject({ id: 'p1', color: '#6366F1' })
    const todos = [makeTodo({ id: 't1', projectId: 'p1' })]
    mockProjects = [project]
    const { container } = render(
      <ProjectSection
        icon={project.emoji}
        name={project.name}
        accentColor={project.color}
        todos={todos}
        allTodos={todos}
        projectId={project.id}
      />
    )
    const section = container.firstChild as HTMLElement
    expect(section.style.borderLeft).toContain('rgb(99, 102, 241)')
  })

  it('should show add task button', () => {
    const project = makeProject({ id: 'p1' })
    const todos = [makeTodo({ id: 't1', projectId: 'p1' })]
    mockProjects = [project]
    render(
      <ProjectSection
        icon={project.emoji}
        name={project.name}
        accentColor={project.color}
        todos={todos}
        allTodos={todos}
        projectId={project.id}
      />
    )
    expect(screen.getByText('タスクを追加')).toBeInTheDocument()
  })

  it('should render all todos in the section', () => {
    const project = makeProject({ id: 'p1' })
    const todos = [
      makeTodo({ id: 't1', title: 'First task', projectId: 'p1' }),
      makeTodo({ id: 't2', title: 'Second task', projectId: 'p1' }),
    ]
    mockProjects = [project]
    render(
      <ProjectSection
        icon={project.emoji}
        name={project.name}
        accentColor={project.color}
        todos={todos}
        allTodos={todos}
        projectId={project.id}
      />
    )
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
  })
})
