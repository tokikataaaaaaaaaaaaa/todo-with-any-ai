import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TodoDetailPage from '@/app/(app)/todos/detail/page'
import { useTodoStore } from '@/stores/todo-store'
import type { Todo } from '@todo-with-any-ai/shared'

// Mock next/navigation
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useSearchParams: () => ({
    get: (key: string) => key === 'id' ? 'todo-1' : null,
  }),
}))

// Mock firebase
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { getIdToken: () => Promise.resolve('test-token') },
  },
}))

// Mock api-client (to avoid import errors - the other agent owns this)
vi.mock('@/lib/api-client', () => ({
  todoClient: {
    updateTodo: vi.fn().mockResolvedValue({}),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
  },
}))

const baseTodo: Todo = {
  id: 'todo-1',
  title: 'Test Todo',
  completed: false,
  dueDate: null,
  parentId: null,
  order: 0,
  depth: 0,
  priority: null,
  categoryIcon: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('TodoDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTodoStore.setState({
      todos: [
        baseTodo,
        { ...baseTodo, id: 'todo-2', title: 'Second Todo' },
      ],
      loading: false,
      error: null,
    })
  })

  it('should display todo detail form', () => {
    render(<TodoDetailPage />)
    expect(screen.getByDisplayValue('Test Todo')).toBeInTheDocument()
  })

  it('should show back button', () => {
    render(<TodoDetailPage />)
    expect(screen.getByRole('button', { name: /戻る/i })).toBeInTheDocument()
  })

  it('should navigate back when back button clicked', () => {
    render(<TodoDetailPage />)
    fireEvent.click(screen.getByRole('button', { name: /戻る/i }))
    expect(mockBack).toHaveBeenCalled()
  })

  it('should show 404 when todo not found', () => {
    useTodoStore.setState({ todos: [], loading: false, error: null })
    render(<TodoDetailPage />)
    expect(screen.getByText(/Todoが見つかりません/i)).toBeInTheDocument()
  })

  it('should display page heading', () => {
    render(<TodoDetailPage />)
    expect(screen.getByText(/Todo詳細/i)).toBeInTheDocument()
  })
})
