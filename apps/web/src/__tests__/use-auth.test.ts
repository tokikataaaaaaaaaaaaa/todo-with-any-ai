import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'

// Mock firebase/auth
const mockOnAuthStateChanged = vi.fn()
const mockSignInWithPopup = vi.fn()
const mockSignOut = vi.fn()

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
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
    // Default: onAuthStateChanged returns unsubscribe fn
    mockOnAuthStateChanged.mockReturnValue(vi.fn())
  })

  it('should have initial state: user null, loading true', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('should set user and loading false when onAuthStateChanged fires with user', () => {
    // Capture the callback passed to onAuthStateChanged
    let authCallback: (user: unknown) => void = () => {}
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (user: unknown) => void) => {
      authCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useAuth())

    act(() => {
      authCallback({
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
      })
    })

    expect(result.current.user).toEqual({
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
    })
    expect(result.current.loading).toBe(false)
  })

  it('should set user null and loading false when onAuthStateChanged fires with null', () => {
    let authCallback: (user: unknown) => void = () => {}
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (user: unknown) => void) => {
      authCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useAuth())

    act(() => {
      authCallback(null)
    })

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

  it('should set user to null after logout', async () => {
    // Set a user first
    useAuthStore.setState({ user: { uid: '123', displayName: 'Test', email: 'test@test.com' }, loading: false })
    mockSignOut.mockResolvedValue(undefined)

    let authCallback: (user: unknown) => void = () => {}
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (user: unknown) => void) => {
      authCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    // Simulate Firebase notifying that user is null after signOut
    act(() => {
      authCallback(null)
    })

    expect(result.current.user).toBeNull()
  })

  it('should handle login error gracefully and return error', async () => {
    mockSignInWithPopup.mockRejectedValue(new Error('auth/popup-closed-by-user'))
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
    expect(error!.message).toBe('auth/popup-closed-by-user')
  })

  it('should unsubscribe from onAuthStateChanged on unmount', () => {
    const unsubscribe = vi.fn()
    mockOnAuthStateChanged.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useAuth())
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('should subscribe to onAuthStateChanged on mount', () => {
    renderHook(() => useAuth())
    expect(mockOnAuthStateChanged).toHaveBeenCalled()
  })
})
