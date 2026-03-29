import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import { useFilterStore } from '@/stores/filter-store'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/todos',
}))

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock stores
let mockTodos: unknown[] = []
let mockProjects: unknown[] = []

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = { todos: mockTodos }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = { projects: mockProjects, fetchProjects: vi.fn() }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import AppLayout from '@/app/(app)/layout'

const originalLocation = window.location

describe('AppLayout - Sidebar integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockTodos = []
    mockProjects = []
    useFilterStore.setState({ filterType: 'all', projectId: null })
    useAuthStore.setState({ user: null, loading: true })
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '/app' },
    })

    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('should render hamburger button for mobile', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('hamburger-button')).toBeInTheDocument()
  })

  it('should render desktop sidebar navigation', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('desktop-sidebar-nav')).toBeInTheDocument()
  })

  it('should toggle sidebar open when hamburger is clicked', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)

    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('should close sidebar when backdrop is clicked', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Open sidebar
    fireEvent.click(screen.getByTestId('hamburger-button'))
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()

    // Close sidebar
    fireEvent.click(screen.getByTestId('sidebar-backdrop'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
