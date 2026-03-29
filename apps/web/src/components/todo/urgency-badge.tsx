import type { UrgencyLevel } from '@todo-with-any-ai/shared'

interface UrgencyBadgeProps {
  urgencyLevelId: string | null | undefined
  levels: UrgencyLevel[]
}

export function UrgencyBadge({ urgencyLevelId, levels }: UrgencyBadgeProps) {
  if (!urgencyLevelId) return null

  const level = levels.find((l) => l.id === urgencyLevelId)
  if (!level) return null

  return (
    <span
      data-testid="urgency-badge"
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: level.color }}
    >
      <span>{level.icon}</span>
      <span>{level.name}</span>
    </span>
  )
}
