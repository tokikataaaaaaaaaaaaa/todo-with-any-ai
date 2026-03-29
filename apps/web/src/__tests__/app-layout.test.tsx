import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import AppLayout from '@/app/(app)/layout'
import { useAuthStore } from '@/stores/auth-store'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
  usePathname: () => '/todos',
}))

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Track window.location.href assignments
const originalLocation = window.location

describe('AppLayout (authenticated)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    useAuthStore.setState({ user: null, loading: true })

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '/app' },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('should redirect to / when user is not authenticated', () => {
    // Also set store to have no user (component checks store in timeout)
    useAuthStore.setState({ user: null, loading: false })
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // The component uses setTimeout with 1500ms delay
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(window.location.href).toBe('/')
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

    expect(screen.getByText(/Todo with Any AI/)).toBeInTheDocument()
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
