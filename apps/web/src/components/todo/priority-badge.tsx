import { cn } from '@/lib/utils'

const fallbackStyles = {
  high: 'bg-[var(--accent)] text-white',
  medium: 'bg-[var(--warning)] text-white',
  low: 'bg-[var(--bg-raised)] text-[var(--text-secondary)]',
} as const

const fallbackLabels = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
} as const

const fallbackLabelsShort = {
  high: 'H',
  medium: 'M',
  low: 'L',
} as const

interface PriorityBadgeProps {
  priority?: 'high' | 'medium' | 'low' | null
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null

  return (
    <span
      data-testid={`priority-badge-${priority}`}
      className={cn(
        'inline-flex flex-shrink-0 items-center rounded-[var(--radius-md)] px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px] font-semibold tracking-wide',
        fallbackStyles[priority]
      )}
    >
      <span data-testid="priority-label-sp" className="sm:hidden">{fallbackLabelsShort[priority]}</span>
      <span data-testid="priority-label-desktop" className="hidden sm:inline">{fallbackLabels[priority]}</span>
    </span>
  )
}
