'use client'

import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, githubProvider, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  const loginWithGithub = async () => {
    if (!auth) throw new Error('Firebase is not configured')
    await signInWithPopup(auth, githubProvider)
  }

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured')
    await signInWithPopup(auth, googleProvider)
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
