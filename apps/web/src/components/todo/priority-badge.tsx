import { cn } from '@/lib/utils'

const styles = {
  high: 'bg-[var(--accent)] text-white',
  medium: 'bg-[var(--warning)] text-white',
  low: 'bg-[var(--bg-raised)] text-[var(--text-secondary)]',
} as const

const labels = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
} as const

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low' | null
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null

  return (
    <span
      data-testid={`priority-badge-${priority}`}
      className={cn(
        'inline-flex items-center rounded-[var(--radius-md)] px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        styles[priority]
      )}
    >
      {labels[priority]}
    </span>
  )
}
