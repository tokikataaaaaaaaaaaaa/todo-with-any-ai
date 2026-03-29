'use client'

import { useState } from 'react'

interface DeleteProjectDialogProps {
  open: boolean
  projectName: string
  todoCount: number
  onConfirm: (action: 'delete' | 'move') => void
  onCancel: () => void
}

export function DeleteProjectDialog({
  open,
  projectName,
  todoCount,
  onConfirm,
  onCancel,
}: DeleteProjectDialogProps) {
  const [selected, setSelected] = useState<'delete' | 'move' | null>(null)

  if (!open) return null

  const hasTodos = todoCount > 0
  const canSubmit = !hasTodos || selected !== null

  const handleConfirm = () => {
    if (hasTodos && selected) {
      onConfirm(selected)
    } else {
      onConfirm('delete')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Dialog content */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          プロジェクトを削除しますか？
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          &quot;{projectName}&quot;
          {hasTodos && <>にはタスク{todoCount}件があります</>}
        </p>

        {hasTodos && (
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="deleteAction"
                value="delete"
                checked={selected === 'delete'}
                onChange={() => setSelected('delete')}
              />
              タスクも削除する
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="deleteAction"
                value="move"
                checked={selected === 'move'}
                onChange={() => setSelected('move')}
              />
              未分類に移動する
            </label>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
