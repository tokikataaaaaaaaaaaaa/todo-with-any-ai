import { cn } from '@/lib/utils'

const styles = {
  high: 'bg-[var(--accent-light)] text-[var(--error)]',
  medium: 'bg-[var(--success-light)] text-[var(--warning)]',
  low: 'bg-[var(--bg-raised)] text-[var(--text-secondary)]',
} as const

const labels = {
  high: '高',
  medium: '中',
  low: '低',
} as const

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low' | null
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles[priority]
      )}
    >
      {labels[priority]}
    </span>
  )
}
