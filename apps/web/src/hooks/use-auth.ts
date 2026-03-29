'use client'

import { signInWithPopup, signInWithRedirect, signOut, type AuthProvider } from 'firebase/auth'
import { auth, githubProvider, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'

async function signInWithProvider(provider: AuthProvider) {
  if (!auth) throw new Error('Firebase is not configured')

  // Try popup first, fallback to redirect if blocked
  try {
    const result = await signInWithPopup(auth, provider)
    return result
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    // Popup blocked or unavailable - fallback to redirect
    if (
      firebaseError.code === 'auth/popup-blocked' ||
      firebaseError.code === 'auth/popup-closed-by-user' ||
      firebaseError.code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(auth, provider)
      return null
    }
    throw error
  }
}

export function useAuth() {
  const { user, loading } = useAuthStore()

  const loginWithGithub = async () => {
    return signInWithProvider(githubProvider)
  }

  const loginWithGoogle = async () => {
    return signInWithProvider(googleProvider)
  }

  const logout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  return {
    user,
    loading,
    loginWithGithub,
    loginWithGoogle,
    logout,
  }
}
