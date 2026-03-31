import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

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

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: vi.fn((selector) => {
    const state = {
      filterType: 'all',
      projectId: null,
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

  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('ProjectSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    mockProjects = []
  })

  it('should render project name and icon', () => {
    const todos = [makeTodo({ id: 't1' })]
    render(
      <ProjectSection
        icon="\u{1F4BC}"
        name="Work"
        accentColor="#C4453C"
        todos={todos}
        allTodos={todos}
        projectId="p1"
      />
    )
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('should show completion progress as completed/total', () => {
    const todos = [
      makeTodo({ id: 't1', completed: true }),
      makeTodo({ id: 't2', completed: false }),
      makeTodo({ id: 't3', completed: true }),
    ]
    render(
      <ProjectSection
        icon="\u{1F3E0}"
        name="Home"
        accentColor="#2E5C3F"
        todos={todos}
        allTodos={todos}
        projectId="p2"
      />
    )
    expect(screen.getByTestId('project-progress')).toHaveTextContent('2/3')
  })

  it('should show add task button', () => {
    const todos = [makeTodo({ id: 't1' })]
    render(
      <ProjectSection
        icon="\u{1F4CB}"
        name="Other"
        accentColor="#E8E4DE"
        todos={todos}
        allTodos={todos}
        projectId={null}
      />
    )
    expect(screen.getByText('タスクを追加')).toBeInTheDocument()
  })

  it('should show inline form when add button clicked', () => {
    const todos = [makeTodo({ id: 't1' })]
    render(
      <ProjectSection
        icon="\u{1F4BC}"
        name="Work"
        accentColor="#C4453C"
        todos={todos}
        allTodos={todos}
        projectId="p1"
      />
    )
    fireEvent.click(screen.getByText('タスクを追加'))
    expect(screen.getByLabelText('New todo title')).toBeInTheDocument()
  })

  it('should call createTodo with correct projectId when adding task', async () => {
    const todos = [makeTodo({ id: 't1', projectId: 'p1' })]
    render(
      <ProjectSection
        icon="\u{1F4BC}"
        name="Work"
        accentColor="#C4453C"
        todos={todos}
        allTodos={todos}
        projectId="p1"
      />
    )
    fireEvent.click(screen.getByText('タスクを追加'))
    const input = screen.getByLabelText('New todo title')
    fireEvent.change(input, { target: { value: 'New task' } })
    // Submit via the create button instead of keyDown, as react-hook-form handles form submit
    const submitButton = screen.getByLabelText('Create todo')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New task',
          projectId: 'p1',
        })
      )
    })
  })

  it('should apply left border with accent color', () => {
    const todos = [makeTodo({ id: 't1' })]
    const { container } = render(
      <ProjectSection
        icon="\u{1F4BC}"
        name="Work"
        accentColor="#C4453C"
        todos={todos}
        allTodos={todos}
        projectId="p1"
      />
    )
    const section = container.firstChild as HTMLElement
    expect(section.style.borderLeft).toContain('rgb(196, 69, 60)')
  })
})
