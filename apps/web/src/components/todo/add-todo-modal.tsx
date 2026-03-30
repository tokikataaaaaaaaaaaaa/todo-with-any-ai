'use client'

import { TodoCreateForm } from '@/components/todo/todo-create-form'

interface AddTodoModalProps {
  open: boolean
  onClose: () => void
}

export function AddTodoModal({ open, onClose }: AddTodoModalProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        data-testid="add-todo-backdrop"
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[var(--bg-surface)] p-4 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {/* Drag handle bar */}
        <div
          data-testid="add-todo-handle"
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)]"
        />
        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className="mb-4 text-lg font-semibold"
        >
          新しいタスク
        </h3>
        <TodoCreateForm />
      </div>
    </>
  )
}
