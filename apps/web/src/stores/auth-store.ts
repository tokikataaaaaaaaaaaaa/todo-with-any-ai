import { create } from 'zustand'

interface AuthState {
  user: { uid: string; displayName: string | null; email: string | null } | null
  loading: boolean
  setUser: (user: AuthState['user']) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
