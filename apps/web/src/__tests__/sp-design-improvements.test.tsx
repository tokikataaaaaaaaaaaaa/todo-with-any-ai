import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppLayout from '@/app/(app)/layout'
import { BottomNav } from '@/components/ui/bottom-nav'
import { TodoNode } from '@/components/todo/todo-node'
import { ProjectSection } from '@/components/todo/project-section'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/todos',
}))

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
    loading: false,
  }),
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

describe('SP Design Improvements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
  })

  describe('Header simplification (SP)', () => {
    it('should wrap nav icons in a container with hidden sm:flex for SP hiding', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      // The nav icons container should have hidden sm:flex classes
      const navIconsContainer = screen.getByTestId('header-nav-icons')
      expect(navIconsContainer.className).toContain('hidden')
      expect(navIconsContainer.className).toContain('sm:flex')
    })

    it('should still render logo text in header', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByText(/Todo with Any AI/)).toBeInTheDocument()
    })
  })

  describe('Todo node action buttons (SP)', () => {
    it('should hide edit button on SP using hidden sm:flex', () => {
      const todo = makeTodo({ id: 'todo-1', title: 'Active Todo' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const editBtn = screen.getByTestId('edit-todo-todo-1')
      // Edit button is hidden on SP via hidden sm:flex
      expect(editBtn.className).toContain('hidden')
      expect(editBtn.className).toContain('sm:flex')
    })

    it('should hide action buttons completely for completed todos', () => {
      const todo = makeTodo({ id: 'todo-done', title: 'Done Todo', completed: true })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      // Completed todos should not render edit/delete/add-child buttons at all
      expect(screen.queryByTestId('edit-todo-todo-done')).not.toBeInTheDocument()
      expect(screen.queryByTestId('delete-todo-todo-done')).not.toBeInTheDocument()
      expect(screen.queryByTestId('add-child-todo-done')).not.toBeInTheDocument()
    })
  })

  describe('Children progress SP hiding', () => {
    it('should wrap children progress in hidden sm:inline-flex container', () => {
      mockExpandedIds.clear()
      const parent = makeTodo({ id: 'p1', title: 'Parent' })
      const child = makeTodo({ id: 'c1', title: 'Child', parentId: 'p1' })
      render(<TodoNode todo={parent} todos={[parent, child]} depth={0} />)

      const progress = screen.getByRole('status')
      // The wrapper should have hidden sm:inline-flex for SP hiding
      const wrapper = progress.closest('[data-testid="children-progress-wrapper"]')
      expect(wrapper).toBeTruthy()
      expect(wrapper!.className).toContain('hidden')
      expect(wrapper!.className).toContain('sm:inline-flex')
    })
  })

  describe('BottomNav safe area', () => {
    it('should have safe-area padding via inline style on nav', () => {
      render(<BottomNav />)
      const nav = screen.getByRole('navigation', { name: /bottom/i })
      // safe-area is applied via inline style paddingBottom
      expect(nav).toHaveStyle({ paddingBottom: 'env(safe-area-inset-bottom)' })
    })
  })

  describe('ProjectSection SP optimization', () => {
    it('should use responsive padding on header', () => {
      const todo = makeTodo({ id: 't1', title: 'Task 1', projectId: 'proj-1' })
      render(
        <ProjectSection
          icon="📁"
          name="Test Project"
          accentColor="#3b82f6"
          todos={[todo]}
          allTodos={[todo]}
          projectId="proj-1"
        />
      )

      // The header should have responsive padding classes
      const section = screen.getByTestId('project-section-proj-1')
      const header = section.querySelector('[data-testid="project-section-header"]')
      expect(header).toBeTruthy()
      expect(header!.className).toContain('px-3')
      expect(header!.className).toContain('sm:px-4')
    })
  })
})
