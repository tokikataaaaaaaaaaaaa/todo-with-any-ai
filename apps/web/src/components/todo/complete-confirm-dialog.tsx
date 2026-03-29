interface CompleteConfirmDialogProps {
  open: boolean
  incompleteCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function CompleteConfirmDialog({
  open,
  incompleteCount,
  onConfirm,
  onCancel,
}: CompleteConfirmDialogProps) {
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
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-lg bg-[var(--bg-surface)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Todoを完了にしますか？
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          未完了のサブタスクが{incompleteCount}件あります。完了にしますか？
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-raised)]"
            aria-label="Cancel"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent)]"
            aria-label="Confirm complete"
          >
            完了にする
          </button>
        </div>
      </div>
    </div>
  )
}
