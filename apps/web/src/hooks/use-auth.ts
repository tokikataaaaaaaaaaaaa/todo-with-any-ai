'use client'

import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, githubProvider, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const { user, loading } = useAuthStore()

  // Auth state is managed by AuthProvider - no duplicate listener here

  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const loginWithGithub = async () => {
    if (!auth) throw new Error('Firebase is not configured')
    if (isMobile) {
      await signInWithRedirect(auth, githubProvider)
    } else {
      await signInWithPopup(auth, githubProvider)
    }
  }

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured')
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider)
    } else {
      await signInWithPopup(auth, googleProvider)
    }
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
