import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { Todo, Project } from '@todo-with-any-ai/shared'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock stores
const mockMoveTodo = vi.fn()
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
      moveTodo: mockMoveTodo,
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

vi.mock('@/stores/urgency-level-store', () => ({
  useUrgencyLevelStore: vi.fn((selector) => {
    const state = { levels: [] }
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
  projectId: 'p1',
  urgencyLevelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('ProjectSection - drop zone for root-level reordering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    mockProjects = []
  })

  it('should have a drop zone in the todo list area', () => {
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
    const dropZone = screen.getByTestId('project-drop-zone-p1')
    expect(dropZone).toBeInTheDocument()
  })

  it('should call moveTodo with root position when dropping on the zone', () => {
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
    const dropZone = screen.getByTestId('project-drop-zone-p1')

    // Simulate drop with dataTransfer
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { getData: () => 'child-1', setData: () => {} },
    })
    Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() })
    Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() })

    act(() => {
      dropZone.dispatchEvent(dropEvent)
    })

    expect(mockMoveTodo).toHaveBeenCalledWith('child-1', 'root', 'p1')
  })

  it('should have a drop zone for uncategorized project (null projectId)', () => {
    const todos = [makeTodo({ id: 't1', projectId: null })]
    render(
      <ProjectSection
        icon="\u{1F4CB}"
        name="Uncategorized"
        accentColor="#ccc"
        todos={todos}
        allTodos={todos}
        projectId={null}
      />
    )
    const dropZone = screen.getByTestId('project-drop-zone-uncategorized')
    expect(dropZone).toBeInTheDocument()
  })
})
