import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/components/auth/auth-provider'

// Mock firebase/auth
const mockOnAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  getAuth: vi.fn(),
  GithubAuthProvider: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  githubProvider: {},
  googleProvider: {},
}))

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChanged.mockReturnValue(vi.fn())
  })

  it('should render children correctly', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should subscribe to onAuthStateChanged on mount', () => {
    render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    )
    expect(mockOnAuthStateChanged).toHaveBeenCalled()
  })

  it('should unsubscribe from onAuthStateChanged on unmount', () => {
    const unsubscribe = vi.fn()
    mockOnAuthStateChanged.mockReturnValue(unsubscribe)

    const { unmount } = render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    )
    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('should render multiple children', () => {
    render(
      <AuthProvider>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </AuthProvider>
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })
})
