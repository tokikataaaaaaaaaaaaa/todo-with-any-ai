import { create } from 'zustand'

export interface SnackbarMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface SnackbarState {
  messages: SnackbarMessage[]
  addMessage: (type: SnackbarMessage['type'], message: string) => void
  removeMessage: (id: string) => void
}

let counter = 0

export const useSnackbarStore = create<SnackbarState>((set) => ({
  messages: [],
  addMessage: (type, message) => {
    const id = `snackbar-${Date.now()}-${++counter}`
    set((state) => ({
      messages: [...state.messages, { id, type, message }],
    }))
  },
  removeMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }))
  },
}))
