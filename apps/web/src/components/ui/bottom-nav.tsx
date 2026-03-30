'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Calendar, FolderOpen, Settings } from 'lucide-react'

const navItems = [
  { href: '/todos', label: 'Todos', icon: CheckSquare, testId: 'bottom-nav-todos' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, testId: 'bottom-nav-calendar' },
  { href: '/projects', label: 'Projects', icon: FolderOpen, testId: 'bottom-nav-projects' },
  { href: '/settings', label: 'Settings', icon: Settings, testId: 'bottom-nav-settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-sm sm:hidden"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              data-active={isActive ? 'true' : 'false'}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
