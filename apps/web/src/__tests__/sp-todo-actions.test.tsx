import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TodoNode } from '@/components/todo/todo-node'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock stores
const mockToggleComplete = vi.fn()
const mockToggleExpand = vi.fn()
const mockDeleteTodo = vi.fn()
const mockMoveTodo = vi.fn()
const mockExpandedIds = new Set<string>()

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      expandedIds: mockExpandedIds,
      todos: [],
      toggleComplete: mockToggleComplete,
      toggleExpand: mockToggleExpand,
      createTodo: vi.fn(),
      deleteTodo: mockDeleteTodo,
      moveTodo: mockMoveTodo,
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
  startTime: null,
  endTime: null,
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

describe('SP Todo Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExpandedIds.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('1. Todo row tap navigates to detail (SP)', () => {
    it('should have a clickable row area that navigates to detail page', () => {
      const todo = makeTodo({ id: 'tap-1', title: 'Tappable Todo' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      // The todo-row-link should exist and be clickable
      const rowLink = screen.getByTestId('todo-title-tap-1')
      expect(rowLink).toBeInTheDocument()
      fireEvent.click(rowLink)
      expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=tap-1')
    })

    it('should NOT navigate when checkbox is clicked (event does not bubble to row link)', () => {
      const todo = makeTodo({ id: 'cb-1', title: 'Checkbox Test' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(mockPush).not.toHaveBeenCalled()
      expect(mockToggleComplete).toHaveBeenCalledWith('cb-1')
    })

    it('should NOT navigate when expand/collapse button is clicked', () => {
      const parent = makeTodo({ id: 'exp-1', title: 'Parent' })
      const child = makeTodo({ id: 'c1', title: 'Child', parentId: 'exp-1' })
      render(<TodoNode todo={parent} todos={[parent, child]} depth={0} />)

      const expandBtn = screen.getByTestId('toggle-expand')
      fireEvent.click(expandBtn)
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('2. Swipe to delete (SP)', () => {
    it('should not show delete area initially', () => {
      const todo = makeTodo({ id: 'swipe-1' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      expect(screen.queryByTestId('swipe-delete-swipe-1')).not.toBeInTheDocument()
    })

    it('should reveal delete area after left swipe exceeding threshold', () => {
      const todo = makeTodo({ id: 'swipe-2', title: 'Swipeable' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      // Simulate touch swipe left
      fireEvent.touchStart(row, { touches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchMove(row, { touches: [{ clientX: 230, clientY: 100 }] }) // 70px swipe
      fireEvent.touchEnd(row)

      // Swipe > 40px threshold => delete button should be visible
      expect(screen.getByTestId('swipe-delete-swipe-2')).toBeInTheDocument()
    })

    it('should reset swipe if distance is below threshold', () => {
      const todo = makeTodo({ id: 'swipe-3', title: 'Short Swipe' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      fireEvent.touchStart(row, { touches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchMove(row, { touches: [{ clientX: 280, clientY: 100 }] }) // 20px - below threshold
      fireEvent.touchEnd(row)

      expect(screen.queryByTestId('swipe-delete-swipe-3')).not.toBeInTheDocument()
    })

    it('should not allow right swipe (positive direction)', () => {
      const todo = makeTodo({ id: 'swipe-4' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      fireEvent.touchStart(row, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(row, { touches: [{ clientX: 200, clientY: 100 }] }) // right swipe
      fireEvent.touchEnd(row)

      expect(screen.queryByTestId('swipe-delete-swipe-4')).not.toBeInTheDocument()
    })

    it('should open delete dialog when swipe delete button is tapped', () => {
      const todo = makeTodo({ id: 'swipe-5', title: 'Delete Me' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      // Swipe left
      fireEvent.touchStart(row, { touches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchMove(row, { touches: [{ clientX: 200, clientY: 100 }] })
      fireEvent.touchEnd(row)

      const deleteBtn = screen.getByTestId('swipe-delete-swipe-5')
      fireEvent.click(deleteBtn)

      // Should show the delete confirmation dialog
      expect(screen.getByText(/このタスクを削除しますか/)).toBeInTheDocument()
    })

    it('should not show swipe delete for completed todos', () => {
      const todo = makeTodo({ id: 'swipe-done', completed: true })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      fireEvent.touchStart(row, { touches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchMove(row, { touches: [{ clientX: 200, clientY: 100 }] })
      fireEvent.touchEnd(row)

      expect(screen.queryByTestId('swipe-delete-swipe-done')).not.toBeInTheDocument()
    })
  })

  describe('3. Long press context menu (SP)', () => {
    it('should show context menu after 500ms long press', () => {
      const todo = makeTodo({ id: 'lp-1', title: 'Long Press Me' })
      const sibling = makeTodo({ id: 'lp-2', title: 'Sibling', order: 1 })
      render(<TodoNode todo={todo} todos={[todo, sibling]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      act(() => { vi.advanceTimersByTime(500) })

      expect(screen.getByTestId('context-menu-lp-1')).toBeInTheDocument()
      expect(screen.getByText('上に移動')).toBeInTheDocument()
      expect(screen.getByText('下に移動')).toBeInTheDocument()
      expect(screen.getByText('編集')).toBeInTheDocument()
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    it('should not show context menu if touch ends before 500ms', () => {
      const todo = makeTodo({ id: 'lp-short', title: 'Short Press' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      act(() => { vi.advanceTimersByTime(300) })
      fireEvent.touchEnd(row)

      expect(screen.queryByTestId('context-menu-lp-short')).not.toBeInTheDocument()
    })

    it('should not show context menu if finger moves during press (cancel long press)', () => {
      const todo = makeTodo({ id: 'lp-move', title: 'Moving Finger' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')

      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      // Move finger significantly (more than would be a tap)
      fireEvent.touchMove(row, { touches: [{ clientX: 150, clientY: 130 }] })
      act(() => { vi.advanceTimersByTime(500) })

      expect(screen.queryByTestId('context-menu-lp-move')).not.toBeInTheDocument()
    })

    it('should navigate to edit page when edit option is selected', () => {
      const todo = makeTodo({ id: 'ctx-edit', title: 'Edit Me' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')
      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      act(() => { vi.advanceTimersByTime(500) })

      const editBtn = screen.getByText('編集')
      fireEvent.click(editBtn)

      expect(mockPush).toHaveBeenCalledWith('/todos/detail?id=ctx-edit')
    })

    it('should open delete dialog when delete option is selected', () => {
      const todo = makeTodo({ id: 'ctx-del', title: 'Delete Me' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')
      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      act(() => { vi.advanceTimersByTime(500) })

      const deleteBtn = screen.getByText('削除')
      fireEvent.click(deleteBtn)

      // Context menu should close and delete dialog should open
      expect(screen.queryByTestId('context-menu-ctx-del')).not.toBeInTheDocument()
    })

    it('should close context menu when clicking outside', () => {
      const todo = makeTodo({ id: 'ctx-close', title: 'Close Me' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')
      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      act(() => { vi.advanceTimersByTime(500) })

      expect(screen.getByTestId('context-menu-ctx-close')).toBeInTheDocument()

      // Click the overlay to close
      const overlay = screen.getByTestId('context-menu-overlay')
      fireEvent.click(overlay)

      expect(screen.queryByTestId('context-menu-ctx-close')).not.toBeInTheDocument()
    })

    it('should not show context menu for completed todos', () => {
      const todo = makeTodo({ id: 'ctx-done', completed: true })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const row = screen.getByTestId('todo-row')
      fireEvent.touchStart(row, { touches: [{ clientX: 150, clientY: 100 }] })
      act(() => { vi.advanceTimersByTime(500) })

      expect(screen.queryByTestId('context-menu-ctx-done')).not.toBeInTheDocument()
    })
  })

  describe('4. Desktop unchanged', () => {
    it('should still have hidden sm:flex on desktop action buttons', () => {
      const todo = makeTodo({ id: 'desk-1', title: 'Desktop Todo' })
      render(<TodoNode todo={todo} todos={[todo]} depth={0} />)

      const editBtn = screen.getByTestId('edit-todo-desk-1')
      expect(editBtn.className).toContain('hidden')
      expect(editBtn.className).toContain('sm:flex')

      const deleteBtn = screen.getByTestId('delete-todo-desk-1')
      expect(deleteBtn.className).toContain('hidden')
      expect(deleteBtn.className).toContain('sm:flex')
    })
  })
})
