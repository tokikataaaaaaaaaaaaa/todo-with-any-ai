import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoNode } from '@/components/todo/todo-node'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the todo store
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockExpandedIds = new Set<string>()

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: mockExpandedIds,
      toggleComplete: mockToggleComplete,
      toggleExpand: mockToggleExpand,
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = { projects: [] }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

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

describe('TodoNode navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    mockPush.mockClear()
  })

  it('should navigate to detail page when title is clicked', () => {
    const todo = makeTodo({ id: 'nav-1', title: 'Navigate Me' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId('todo-title-nav-1')
    fireEvent.click(titleButton)

    expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=nav-1')
  })

  it('should NOT navigate when checkbox is clicked', () => {
    const todo = makeTodo({ id: 'cb-1', title: 'Checkbox Test' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockPush).not.toHaveBeenCalled()
    expect(mockToggleComplete).toHaveBeenCalledWith('cb-1')
  })

  it('should NOT navigate when expand/collapse button is clicked', () => {
    const parent = makeTodo({ id: 'exp-1', title: 'Parent' })
    const child = makeTodo({ id: 'exp-child', title: 'Child', parentId: 'exp-1' })
    render(<TodoNode todo={parent} todos={[parent, child]} depth={0} />)

    const expandButton = screen.getByTestId('toggle-expand')
    fireEvent.click(expandButton)

    expect(mockPush).not.toHaveBeenCalled()
    expect(mockToggleExpand).toHaveBeenCalledWith('exp-1')
  })

  it('should have cursor-pointer class on title', () => {
    const todo = makeTodo({ title: 'Pointer Test' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId(`todo-title-${todo.id}`)
    expect(titleButton.className).toMatch(/cursor-pointer/)
  })

  it('should have hover styles on todo row', () => {
    const todo = makeTodo({ title: 'Hover Test' })
    const { container } = render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    // Hover effect is on the row, not the title button
    const row = container.querySelector('[data-testid="todo-row"]')
    expect(row?.className).toMatch(/hover:bg-/)
  })

  it('should navigate even for completed todos', () => {
    const todo = makeTodo({ id: 'done-1', title: 'Completed Task', completed: true })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId(`todo-title-${todo.id}`)
    fireEvent.click(titleButton)

    expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=done-1')
  })

  it('should set correct URL with todo id', () => {
    const todo = makeTodo({ id: 'unique-id-123', title: 'URL Test' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId(`todo-title-${todo.id}`)
    fireEvent.click(titleButton)

    expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=unique-id-123')
  })

  it('should navigate to correct id when child todo title is clicked', () => {
    mockExpandedIds.add('parent-nav')
    const parent = makeTodo({ id: 'parent-nav', title: 'Parent' })
    const child = makeTodo({ id: 'child-nav-42', title: 'Child Todo', parentId: 'parent-nav' })
    render(<TodoNode todo={parent} todos={[parent, child]} depth={0} />)

    const childTitle = screen.getByTestId('todo-title-child-nav-42')
    fireEvent.click(childTitle)

    expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=child-nav-42')
  })

  it('should render title as a clickable element (not plain text)', () => {
    const todo = makeTodo({ title: 'Clickable Test' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId(`todo-title-${todo.id}`)
    expect(titleButton.tagName.toLowerCase()).toBe('button')
  })

  it('should preserve line-through style on completed todo title while being clickable', () => {
    const todo = makeTodo({ id: 'style-1', title: 'Styled Done', completed: true })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId(`todo-title-${todo.id}`)
    expect(titleButton.className).toMatch(/line-through/)
    expect(titleButton.className).toMatch(/cursor-pointer/)
  })
})
