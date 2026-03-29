import { cn } from '@/lib/utils'

interface ChildrenProgressProps {
  completedCount: number
  totalCount: number
}

export function ChildrenProgress({ completedCount, totalCount }: ChildrenProgressProps) {
  if (totalCount === 0) return null

  const allCompleted = completedCount === totalCount

  return (
    <span
      role="status"
      aria-label={`${completedCount} of ${totalCount} subtasks completed`}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        allCompleted
          ? 'bg-[var(--success-light)] text-[var(--success)]'
          : 'bg-[var(--bg-raised)] text-[var(--text-secondary)]'
      )}
    >
      {completedCount}/{totalCount}
    </span>
  )
}
