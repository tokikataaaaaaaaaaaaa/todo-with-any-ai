import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'

// Mock firebase/auth
const mockSignInWithPopup = vi.fn()
const mockSignInWithRedirect = vi.fn()
const mockSignOut = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getAuth: vi.fn(),
  GithubAuthProvider: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  githubProvider: {},
  googleProvider: {},
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth store
    useAuthStore.setState({ user: null, loading: true })
  })

  it('should have initial state: user null, loading true', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('should reflect auth store user state', () => {
    useAuthStore.setState({
      user: { uid: 'test-uid', displayName: 'Test User', email: 'test@example.com' },
      loading: false,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual({
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
    })
    expect(result.current.loading).toBe(false)
  })

  it('should reflect auth store loading false with no user', () => {
    useAuthStore.setState({ user: null, loading: false })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('should call signInWithPopup with github provider on loginWithGithub', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: { uid: '123' } })
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.loginWithGithub()
    })

    expect(mockSignInWithPopup).toHaveBeenCalled()
  })

  it('should call signInWithPopup with google provider on loginWithGoogle', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: { uid: '456' } })
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.loginWithGoogle()
    })

    expect(mockSignInWithPopup).toHaveBeenCalled()
  })

  it('should call signOut on logout', async () => {
    mockSignOut.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should fallback to signInWithRedirect when popup is blocked', async () => {
    mockSignInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked' })
    mockSignInWithRedirect.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.loginWithGithub()
    })

    expect(mockSignInWithRedirect).toHaveBeenCalled()
  })

  it('should throw error for non-popup-related auth errors', async () => {
    mockSignInWithPopup.mockRejectedValue(new Error('auth/internal'))
    const { result } = renderHook(() => useAuth())

    let error: Error | null = null
    await act(async () => {
      try {
        await result.current.loginWithGithub()
      } catch (e) {
        error = e as Error
      }
    })

    expect(error).not.toBeNull()
    expect(error!.message).toBe('auth/internal')
  })
})
