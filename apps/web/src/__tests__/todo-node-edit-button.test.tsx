import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock stores
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockCreateTodo = vi.fn()
const mockDeleteTodo = vi.fn()
const mockExpandedIds = new Set<string>()

let mockProjects: Project[] = []

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: mockExpandedIds,
      toggleComplete: mockToggleComplete,
      toggleExpand: mockToggleExpand,
      createTodo: mockCreateTodo,
      deleteTodo: mockDeleteTodo,
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

describe('TodoNode - edit button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    mockProjects = []
    mockPush.mockClear()
  })

  it('should render an edit button for each todo', () => {
    const todo = makeTodo({ id: 'todo-1', title: 'Editable Todo' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.getByTestId('edit-todo-todo-1')).toBeInTheDocument()
  })

  it('should have correct aria-label on edit button', () => {
    const todo = makeTodo({ id: 'todo-1', title: 'My Task' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const editBtn = screen.getByTestId('edit-todo-todo-1')
    expect(editBtn).toHaveAttribute('aria-label', 'Edit "My Task"')
  })

  it('should navigate to detail page when edit button is clicked', () => {
    const todo = makeTodo({ id: 'todo-42', title: 'Navigate Todo' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    fireEvent.click(screen.getByTestId('edit-todo-todo-42'))
    expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=todo-42')
  })

  it('should be hidden by default and visible on group hover (has opacity-0 class)', () => {
    const todo = makeTodo({ id: 'todo-1' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const editBtn = screen.getByTestId('edit-todo-todo-1')
    // Mobile-first: visible by default (opacity-100), hidden on sm+ (sm:opacity-0), shown on group hover (sm:group-hover:opacity-100)
    expect(editBtn.className).toContain('sm:opacity-0')
    expect(editBtn.className).toContain('sm:group-hover:opacity-100')
  })
})
