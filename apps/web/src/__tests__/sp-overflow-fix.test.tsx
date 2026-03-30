import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoNode } from '@/components/todo/todo-node'
import { PriorityBadge } from '@/components/todo/priority-badge'
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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('SP horizontal overflow fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
  })

  describe('TodoNode overflow prevention', () => {
    it('should have overflow-hidden on the todo row container', () => {
      const todo = makeTodo({ title: 'A very long title that could cause overflow on small screens' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')
      expect(row.className).toContain('overflow-hidden')
    })

    it('should have min-w-0 on the title button for truncate to work in flex', () => {
      const todo = makeTodo({ title: 'A very long title that should be truncated' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const titleButton = screen.getByTestId('todo-title-todo-1')
      expect(titleButton.className).toContain('min-w-0')
      expect(titleButton.className).toContain('truncate')
    })
  })

  describe('PriorityBadge SP abbreviation', () => {
    it('should show abbreviated label on SP via responsive classes for high priority', () => {
      const { container } = render(<PriorityBadge priority="high" />)
      const badge = screen.getByTestId('priority-badge-high')

      // Should have a full label hidden on SP and a short label visible on SP
      const spLabel = badge.querySelector('[data-testid="priority-label-sp"]')
      const desktopLabel = badge.querySelector('[data-testid="priority-label-desktop"]')

      expect(spLabel).toBeTruthy()
      expect(desktopLabel).toBeTruthy()
      expect(spLabel!.textContent).toBe('H')
      expect(desktopLabel!.textContent).toBe('High')
    })

    it('should show abbreviated label on SP for medium priority', () => {
      render(<PriorityBadge priority="medium" />)
      const badge = screen.getByTestId('priority-badge-medium')

      const spLabel = badge.querySelector('[data-testid="priority-label-sp"]')
      const desktopLabel = badge.querySelector('[data-testid="priority-label-desktop"]')

      expect(spLabel!.textContent).toBe('M')
      expect(desktopLabel!.textContent).toBe('Med')
    })

    it('should show abbreviated label on SP for low priority', () => {
      render(<PriorityBadge priority="low" />)
      const badge = screen.getByTestId('priority-badge-low')

      const spLabel = badge.querySelector('[data-testid="priority-label-sp"]')
      const desktopLabel = badge.querySelector('[data-testid="priority-label-desktop"]')

      expect(spLabel!.textContent).toBe('L')
      expect(desktopLabel!.textContent).toBe('Low')
    })
  })

  describe('Layout overflow prevention', () => {
    it('should have overflow-x-hidden on main content area in layout', async () => {
      // Mock useAuth for layout - must be set before import
      vi.mock('@/hooks/use-auth', () => ({
        useAuth: () => ({
          user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
          loading: false,
        }),
      }))

      const { default: AppLayout } = await import('@/app/(app)/layout')

      render(
        <AppLayout>
          <div data-testid="child-content">Content</div>
        </AppLayout>
      )

      const main = document.querySelector('main')
      expect(main).toBeTruthy()
      expect(main!.className).toContain('overflow-x-hidden')
    })
  })
})
