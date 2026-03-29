interface DeleteTodoDialogProps {
  open: boolean
  todoTitle: string
  childCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteTodoDialog({
  open,
  todoTitle,
  childCount,
  onConfirm,
  onCancel,
}: DeleteTodoDialogProps) {
  if (!open) return null

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
          このタスクを削除しますか？
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          &quot;{todoTitle}&quot;
          {childCount > 0 && (
            <>を削除すると、子タスク{childCount}件も削除されます</>
          )}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
