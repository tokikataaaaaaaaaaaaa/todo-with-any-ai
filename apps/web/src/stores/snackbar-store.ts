import { create } from 'zustand'

export interface SnackbarAction {
  label: string
  onClick: () => void
}

export interface SnackbarMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  action?: SnackbarAction
}

interface SnackbarState {
  messages: SnackbarMessage[]
  addMessage: (type: SnackbarMessage['type'], message: string, action?: SnackbarAction) => void
  removeMessage: (id: string) => void
}

let counter = 0

export const useSnackbarStore = create<SnackbarState>((set) => ({
  messages: [],
  addMessage: (type, message, action?) => {
    const id = `snackbar-${Date.now()}-${++counter}`
    set((state) => ({
      messages: [...state.messages, { id, type, message, action }],
    }))
  },
  removeMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }))
  },
}))
