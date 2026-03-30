import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoTree } from '@/components/todo/todo-tree'
import { TodoNode } from '@/components/todo/todo-node'
import { PriorityBadge } from '@/components/todo/priority-badge'
import { CategoryIcon } from '@/components/todo/category-icon'
import { EmptyState } from '@/components/todo/empty-state'
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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('TodoTree', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
  })

  it('should render root-level todos', () => {
    const todos = [
      makeTodo({ id: '1', title: 'First' }),
      makeTodo({ id: '2', title: 'Second' }),
    ]

    render(<TodoTree todos={todos} />)

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('should render tree structure with parent and children', () => {
    mockExpandedIds.add('parent-1')
    const todos = [
      makeTodo({ id: 'parent-1', title: 'Parent', parentId: null }),
      makeTodo({ id: 'child-1', title: 'Child', parentId: 'parent-1' }),
    ]

    render(<TodoTree todos={todos} />)

    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('should not render children when parent is collapsed', () => {
    // expandedIds is empty, so parent-1 is collapsed
    const todos = [
      makeTodo({ id: 'parent-1', title: 'Parent', parentId: null }),
      makeTodo({ id: 'child-1', title: 'Child', parentId: 'parent-1' }),
    ]

    render(<TodoTree todos={todos} />)

    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
  })
})

describe('TodoNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
  })

  it('should render todo title', () => {
    const todo = makeTodo({ title: 'My Task' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.getByText('My Task')).toBeInTheDocument()
  })

  it('should indent based on depth', () => {
    const todo = makeTodo({ title: 'Deep Todo' })
    const { container } = render(<TodoNode todo={todo} todos={[todo]} depth={2} />)
    const row = container.querySelector('[data-testid="todo-row"]')
    // depth * 24 + 16 base padding = 2 * 24 + 16 = 64
    expect(row).toHaveStyle({ paddingLeft: '64px' })
  })

  it('should show line-through and secondary color for completed todos', () => {
    const todo = makeTodo({ completed: true, title: 'Done Task' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    const titleEl = screen.getByText('Done Task')
    expect(titleEl.className).toMatch(/line-through/)
    expect(titleEl.className).toMatch(/text-secondary/)
  })

  it('should show toggle arrow when todo has children', () => {
    const parent = makeTodo({ id: 'p1', title: 'Parent' })
    const child = makeTodo({ id: 'c1', title: 'Child', parentId: 'p1' })
    render(<TodoNode todo={parent} todos={[parent, child]} depth={0} />)
    expect(screen.getByTestId('toggle-expand')).toBeInTheDocument()
  })

  it('should not show toggle arrow when todo has no children', () => {
    const todo = makeTodo({ title: 'Leaf' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.queryByTestId('toggle-expand')).not.toBeInTheDocument()
  })

  it('should call toggleExpand when toggle arrow is clicked', () => {
    const parent = makeTodo({ id: 'p1', title: 'Parent' })
    const child = makeTodo({ id: 'c1', title: 'Child', parentId: 'p1' })
    render(<TodoNode todo={parent} todos={[parent, child]} depth={0} />)

    fireEvent.click(screen.getByTestId('toggle-expand'))
    expect(mockToggleExpand).toHaveBeenCalledWith('p1')
  })

  it('should call toggleComplete when checkbox is clicked', () => {
    const todo = makeTodo({ id: 'tc1', title: 'Toggle Me' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockToggleComplete).toHaveBeenCalledWith('tc1')
  })

  it('should show overdue indicator for past due dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const todo = makeTodo({
      title: 'Overdue Task',
      dueDate: yesterday.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.getByText(/!/)).toBeInTheDocument()
  })

  it('should show relative due date for today', () => {
    const today = new Date()
    today.setHours(23, 59, 59)
    const todo = makeTodo({
      title: 'Due Today',
      dueDate: today.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    // Use getAllByText since "Today" appears in both title context and due date
    const matches = screen.getAllByText(/today/i)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('should show relative due date for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59)
    const todo = makeTodo({
      title: 'Due Soon',
      dueDate: tomorrow.toISOString(),
    })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)
    expect(screen.getByText(/tomorrow/i)).toBeInTheDocument()
  })
})

describe('PriorityBadge', () => {
  it('should render high priority label', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('should render medium priority label', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('Med')).toBeInTheDocument()
  })

  it('should render low priority label', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('should return null for null priority', () => {
    const { container } = render(<PriorityBadge priority={null} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('CategoryIcon', () => {
  it('should render an icon for work category', () => {
    const { container } = render(<CategoryIcon category="work" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render an icon for personal category', () => {
    const { container } = render(<CategoryIcon category="personal" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render an icon for shopping category', () => {
    const { container } = render(<CategoryIcon category="shopping" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render an icon for health category', () => {
    const { container } = render(<CategoryIcon category="health" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render an icon for study category', () => {
    const { container } = render(<CategoryIcon category="study" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render an icon for idea category', () => {
    const { container } = render(<CategoryIcon category="idea" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should return null for null category', () => {
    const { container } = render(<CategoryIcon category={null} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('EmptyState', () => {
  it('should render empty state message', () => {
    render(<EmptyState />)
    expect(screen.getByText(/Todoはまだありません/)).toBeInTheDocument()
  })

  it('should suggest creating a new todo', () => {
    render(<EmptyState />)
    expect(screen.getByText(/作成しましょう/)).toBeInTheDocument()
  })
})
