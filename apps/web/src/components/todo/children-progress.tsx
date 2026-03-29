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
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      )}
    >
      {completedCount}/{totalCount}
    </span>
  )
}
