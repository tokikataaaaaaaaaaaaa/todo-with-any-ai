import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppLayout from '@/app/(app)/layout'
import { useAuthStore } from '@/stores/auth-store'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

const originalLocation = window.location

describe('AppLayout - Calendar Icon (SDD-004-FE-06)', () => {
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

  it('should render calendar icon in header when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
  })

  it('should link calendar icon to /calendar', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    const calendarIcon = screen.getByTestId('calendar-icon')
    const link = calendarIcon.closest('a')
    expect(link).toHaveAttribute('href', '/calendar')
  })

  it('should render calendar icon alongside existing icons', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
    })

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
  })
})
