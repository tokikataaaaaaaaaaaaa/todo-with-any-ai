import { ClipboardList } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ClipboardList className="h-12 w-12 text-[var(--text-muted)]" />
      <h3 className="mt-4 text-lg font-medium text-[var(--text)]">
        No todos yet
      </h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Create your first todo to get started.
      </p>
    </div>
  )
}
