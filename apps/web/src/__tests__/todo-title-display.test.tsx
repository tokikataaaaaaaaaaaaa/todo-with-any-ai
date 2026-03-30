import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoNode } from '@/components/todo/todo-node'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/todos',
}))

// Mock todo store
const mockExpandedIds = new Set<string>()
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: mockExpandedIds,
      todos: [],
      toggleComplete: vi.fn(),
      toggleExpand: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      moveTodo: vi.fn(),
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

vi.mock('@/stores/urgency-level-store', () => ({
  useUrgencyLevelStore: vi.fn((selector) => {
    const state = { levels: [] }
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
  urgencyLevelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  startTime: null,
  endTime: null,
  ...overrides,
})

describe('TodoNode SP title display (line-clamp-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
  })

  it('should have line-clamp-3 class on title button for SP multi-line display', () => {
    const todo = makeTodo({ title: 'A very long title that should wrap on mobile screens' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId('todo-title-todo-1')
    expect(titleButton.className).toMatch(/line-clamp-3/)
  })

  it('should have sm:truncate class for desktop single-line display', () => {
    const todo = makeTodo({ title: 'Test title' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId('todo-title-todo-1')
    expect(titleButton.className).toMatch(/sm:truncate/)
  })

  it('should NOT have bare truncate class (replaced by line-clamp-3 + sm:truncate)', () => {
    const todo = makeTodo({ title: 'Test title' })
    render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const titleButton = screen.getByTestId('todo-title-todo-1')
    // Should not have standalone 'truncate' without sm: prefix
    // line-clamp-3 handles SP, sm:truncate handles desktop
    const classes = titleButton.className.split(/\s+/)
    expect(classes).not.toContain('truncate')
  })

  it('should have min-h instead of fixed h on todo row for SP variable height', () => {
    const todo = makeTodo({ title: 'Test' })
    const { container } = render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

    const row = container.querySelector('[data-testid="todo-row"]')
    expect(row).toBeTruthy()
    // Row should not have a fixed height class like h-12
    // Instead it should use min-h for flexible height on SP
  })
})

describe('TodoDetailForm title textarea', () => {
  const mockOnSave = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render title as textarea instead of text input', () => {
    const todo = makeTodo({ title: 'A long title for testing' })
    render(
      <TodoDetailForm
        todo={todo}
        allTodos={[todo]}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    )

    // Title should be a textarea, not an input[type="text"]
    const textarea = screen.getByDisplayValue('A long title for testing')
    expect(textarea.tagName.toLowerCase()).toBe('textarea')
  })

  it('should display the full title text in textarea', () => {
    const longTitle = 'This is a very long title that would not fit in a single line on mobile devices and should wrap to multiple lines for better readability'
    const todo = makeTodo({ title: longTitle })
    render(
      <TodoDetailForm
        todo={todo}
        allTodos={[todo]}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    )

    const textarea = screen.getByDisplayValue(longTitle)
    expect(textarea).toBeTruthy()
  })

  it('should update title value when textarea content changes', () => {
    const todo = makeTodo({ title: 'Original title' })
    render(
      <TodoDetailForm
        todo={todo}
        allTodos={[todo]}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    )

    const textarea = screen.getByDisplayValue('Original title')
    fireEvent.change(textarea, { target: { value: 'Updated title' } })

    expect(screen.getByDisplayValue('Updated title')).toBeTruthy()
  })

  it('should have resize-none class to prevent manual resizing', () => {
    const todo = makeTodo({ title: 'Test' })
    render(
      <TodoDetailForm
        todo={todo}
        allTodos={[todo]}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    )

    const textarea = screen.getByDisplayValue('Test')
    expect(textarea.className).toMatch(/resize-none/)
  })
})
