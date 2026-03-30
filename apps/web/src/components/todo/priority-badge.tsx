import { cn } from '@/lib/utils'
import type { UrgencyLevel } from '@todo-with-any-ai/shared'

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

interface PriorityBadgeProps {
  priority?: 'high' | 'medium' | 'low' | null
  urgencyLevelId?: string | null
  urgencyLevels?: UrgencyLevel[]
}

export function PriorityBadge({ priority, urgencyLevelId, urgencyLevels }: PriorityBadgeProps) {
  // Prefer urgencyLevelId if available
  if (urgencyLevelId && urgencyLevels && urgencyLevels.length > 0) {
    const level = urgencyLevels.find((l) => l.id === urgencyLevelId)
    if (level) {
      return (
        <span
          data-testid={`priority-badge-urgency`}
          className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px] font-semibold tracking-wide text-white"
          style={{ backgroundColor: level.color }}
        >
          {level.icon && <span>{level.icon}</span>}
          {level.name}
        </span>
      )
    }
  }

  // Fallback to legacy priority field
  if (!priority) return null

  return (
    <span
      data-testid={`priority-badge-${priority}`}
      className={cn(
        'inline-flex items-center rounded-[var(--radius-md)] px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px] font-semibold tracking-wide',
        fallbackStyles[priority]
      )}
    >
      {fallbackLabels[priority]}
    </span>
  )
}
