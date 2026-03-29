import {
  Briefcase,
  User,
  ShoppingCart,
  Heart,
  BookOpen,
  Lightbulb,
} from 'lucide-react'

const iconMap = {
  work: Briefcase,
  personal: User,
  shopping: ShoppingCart,
  health: Heart,
  study: BookOpen,
  idea: Lightbulb,
} as const

interface CategoryIconProps {
  category: 'work' | 'personal' | 'shopping' | 'health' | 'study' | 'idea' | null
  className?: string
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  if (!category) return null

  const Icon = iconMap[category]
  return <Icon className={className ?? 'h-4 w-4 text-[var(--text-secondary)]'} />
}
