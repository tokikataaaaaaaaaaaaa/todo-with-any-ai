import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/page'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}))

// Mock useAuth hook
const mockLoginWithGithub = vi.fn()
const mockLoginWithGoogle = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Track window.location.href assignments
const originalLocation = window.location

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '/' },
    })

    // Default: not logged in, not loading
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginWithGithub: mockLoginWithGithub,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('should render the GitHub login button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument()
  })

  it('should render the Google login button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
  })

  it('should display the core message text', () => {
    render(<LoginPage />)
    expect(screen.getByText(/AIエージェントのためのTodoアプリ/)).toBeInTheDocument()
  })

  it('should display "人間も使える。" message', () => {
    render(<LoginPage />)
    expect(screen.getByText(/人間も使える/)).toBeInTheDocument()
  })

  it('should display "todo-with-any-ai" text', () => {
    render(<LoginPage />)
    expect(screen.getByText(/todo-with-any-ai/)).toBeInTheDocument()
  })

  it('should display the sparkle icon', () => {
    render(<LoginPage />)
    // The logo area with sparkle icon
    expect(screen.getByTestId('logo-icon')).toBeInTheDocument()
  })

  it('should redirect to /todos when user is already logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
      loginWithGithub: mockLoginWithGithub,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    })

    render(<LoginPage />)

    // The component uses setTimeout with 500ms delay for redirect
    vi.advanceTimersByTime(500)

    expect(window.location.href).toBe('/todos')
  })

  it('should not redirect when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      loginWithGithub: mockLoginWithGithub,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    })

    render(<LoginPage />)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should call loginWithGithub when GitHub button is clicked', async () => {
    vi.useRealTimers()
    mockLoginWithGithub.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => {
      expect(mockLoginWithGithub).toHaveBeenCalled()
    })
  })

  it('should call loginWithGoogle when Google button is clicked', async () => {
    vi.useRealTimers()
    mockLoginWithGoogle.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled()
    })
  })

  it('should show error message when GitHub login fails', async () => {
    vi.useRealTimers()
    mockLoginWithGithub.mockRejectedValue(new Error('auth/popup-closed-by-user'))
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('should show error message when Google login fails', async () => {
    vi.useRealTimers()
    mockLoginWithGoogle.mockRejectedValue(new Error('auth/internal-error'))
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('should show loading spinner/state during authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      loginWithGithub: mockLoginWithGithub,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    })

    render(<LoginPage />)
    expect(screen.getByTestId('login-loading')).toBeInTheDocument()
  })

  it('should have GitHub button with correct styling (dark background)', () => {
    render(<LoginPage />)
    const githubBtn = screen.getByRole('button', { name: /github/i })
    expect(githubBtn.className).toMatch(/bg-zinc-900|bg-\[#24292f\]/)
  })

  it('should have Google button with border styling', () => {
    render(<LoginPage />)
    const googleBtn = screen.getByRole('button', { name: /google/i })
    expect(googleBtn.className).toMatch(/border/)
  })
})
