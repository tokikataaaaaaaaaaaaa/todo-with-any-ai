'use client'

import { useEffect, type ReactNode } from 'react'
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    // Process redirect result first (for signInWithRedirect on mobile)
    // This must resolve before we trust onAuthStateChanged's initial null
    let redirectHandled = false

    getRedirectResult(auth)
      .then((result) => {
        redirectHandled = true
        if (result?.user) {
          setUser({
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
          })
          setLoading(false)
        }
      })
      .catch(() => {
        redirectHandled = true
      })

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
        })
        setLoading(false)
      } else {
        // If redirect hasn't been handled yet, wait before setting null
        // to avoid a flash of unauthenticated state
        if (!redirectHandled) {
          setTimeout(() => {
            if (!useAuthStore.getState().user) {
              setUser(null)
              setLoading(false)
            }
          }, 1000)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  return <>{children}</>
}
