import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
  apiClient: {
    listTodos: vi.fn().mockResolvedValue([]),
    updateTodo: vi.fn().mockResolvedValue({}),
    deleteTodo: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false,
  }),
}))

// Mock project store
vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: [],
      fetchProjects: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))


// Mock snackbar store
vi.mock('@/stores/snackbar-store', () => ({
  useSnackbarStore: vi.fn((selector) => {
    const state = {
      messages: [],
      addMessage: vi.fn(),
      removeMessage: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
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
  description: null,
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

  it('should show 404 when todo not found', async () => {
    useTodoStore.setState({ todos: [], loading: false, error: null })
    render(<TodoDetailPage />)
    // The component tries to fetchTodos when store is empty, then shows 404
    await waitFor(() => {
      expect(screen.getByText(/Todoが見つかりません/i)).toBeInTheDocument()
    })
  })

  it('should display page heading', () => {
    render(<TodoDetailPage />)
    expect(screen.getByText(/Todo詳細/i)).toBeInTheDocument()
  })
})
