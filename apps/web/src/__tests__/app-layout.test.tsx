import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppLayout from '@/app/(app)/layout'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}))

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('AppLayout (authenticated)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to / when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div data-testid="app-content">App Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('app-content')).toBeInTheDocument()
  })

  it('should show loading skeleton while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('app-loading')).toBeInTheDocument()
  })

  it('should not redirect while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should render header with logo', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByText(/todo-with-any-ai/)).toBeInTheDocument()
  })

  it('should render settings icon in header', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
  })

  it('should render activity log icon in header', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
  })
})
