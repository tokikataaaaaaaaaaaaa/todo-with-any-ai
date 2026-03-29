import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/page'
import { useSnackbarStore } from '@/stores/snackbar-store'

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

describe('LoginPage Snackbar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSnackbarStore.setState({ messages: [] })

    // Mock window.location
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
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('should show success snackbar on GitHub login success', async () => {
    mockLoginWithGithub.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => {
      const { messages } = useSnackbarStore.getState()
      const successMsg = messages.find((m) => m.type === 'success')
      expect(successMsg).toBeDefined()
      expect(successMsg?.message).toMatch(/ログインしました/)
    })
  })

  it('should set window.location.href to /todos on login success', async () => {
    mockLoginWithGithub.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => {
      expect(window.location.href).toBe('/todos')
    })
  })

  it('should show error snackbar on GitHub login failure', async () => {
    mockLoginWithGithub.mockRejectedValue(new Error('auth/popup-closed'))
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => {
      const { messages } = useSnackbarStore.getState()
      const errorMsg = messages.find((m) => m.type === 'error')
      expect(errorMsg).toBeDefined()
      expect(errorMsg?.message).toMatch(/ログインに失敗しました/)
    })
  })

  it('should show error snackbar with correct message on failure', async () => {
    mockLoginWithGithub.mockRejectedValue(new Error('auth/internal'))
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => {
      const { messages } = useSnackbarStore.getState()
      const errorMsg = messages.find((m) => m.type === 'error')
      expect(errorMsg?.message).toBe('ログインに失敗しました。もう一度お試しください。')
    })
  })

  it('should show success snackbar on Google login success', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      const { messages } = useSnackbarStore.getState()
      const successMsg = messages.find((m) => m.type === 'success')
      expect(successMsg).toBeDefined()
      expect(successMsg?.message).toMatch(/ログインしました/)
    })
  })

  it('should show error snackbar on Google login failure', async () => {
    mockLoginWithGoogle.mockRejectedValue(new Error('auth/internal'))
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      const { messages } = useSnackbarStore.getState()
      const errorMsg = messages.find((m) => m.type === 'error')
      expect(errorMsg).toBeDefined()
      expect(errorMsg?.message).toMatch(/ログインに失敗しました/)
    })
  })

  it('should redirect when user is already logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com' },
      loading: false,
      loginWithGithub: mockLoginWithGithub,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    })

    render(<LoginPage />)
    expect(window.location.href).toBe('/todos')
  })

  it('should not show snackbar when login is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      loginWithGithub: mockLoginWithGithub,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    })

    render(<LoginPage />)
    expect(useSnackbarStore.getState().messages).toHaveLength(0)
  })

  it('should show error snackbar with type error (red)', async () => {
    mockLoginWithGoogle.mockRejectedValue(new Error('fail'))
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      const { messages } = useSnackbarStore.getState()
      const errorMsg = messages.find((m) => m.type === 'error')
      expect(errorMsg?.type).toBe('error')
    })
  })
})
