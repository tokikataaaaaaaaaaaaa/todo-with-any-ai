'use client'

import { useEffect, useRef } from 'react'
import { useSnackbarStore, type SnackbarMessage } from '@/stores/snackbar-store'

const typeStyles: Record<SnackbarMessage['type'], string> = {
  success: 'bg-emerald-600 dark:bg-emerald-500 text-white',
  error: 'bg-red-600 dark:bg-red-500 text-white',
  info: 'bg-indigo-600 dark:bg-indigo-500 text-white',
}

function SnackbarItem({ message }: { message: SnackbarMessage }) {
  const removeMessage = useSnackbarStore((s) => s.removeMessage)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      removeMessage(message.id)
    }, 3000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [message.id, removeMessage])

  return (
    <div
      data-testid="snackbar-item"
      className={`${typeStyles[message.type]} flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-bottom fade-in duration-200`}
    >
      <span className="text-sm font-medium">{message.message}</span>
      <div className="flex items-center gap-2">
        {message.action && (
          <button
            onClick={() => {
              message.action?.onClick()
              removeMessage(message.id)
            }}
            data-testid="snackbar-action"
            className="shrink-0 rounded px-2 py-0.5 text-sm font-semibold text-white underline underline-offset-2 hover:text-white/90 transition-colors"
          >
            {message.action.label}
          </button>
        )}
        <button
          onClick={() => removeMessage(message.id)}
          aria-label="閉じる"
          className="shrink-0 rounded p-0.5 text-white/80 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function SnackbarProvider() {
  const messages = useSnackbarStore((s) => s.messages)

  return (
    <div
      data-testid="snackbar-container"
      className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-[90%] -translate-x-1/2 flex-col gap-2 sm:max-w-sm"
    >
      {messages.map((message) => (
        <SnackbarItem key={message.id} message={message} />
      ))}
    </div>
  )
}
