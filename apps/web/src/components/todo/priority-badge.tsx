import { cn } from '@/lib/utils'

const styles = {
  high: 'bg-red-100 text-red-7000/20',
  medium: 'bg-amber-100 text-amber-700/20',
  low: 'bg-indigo-100 text-indigo-700/20',
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
      {priority}
    </span>
  )
}
