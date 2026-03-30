'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CheckSquare, Calendar, FolderOpen, Settings, Plus } from 'lucide-react'

const leftNavItems = [
  { href: '/todos', label: 'Todos', icon: CheckSquare, testId: 'bottom-nav-todos' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, testId: 'bottom-nav-calendar' },
] as const

const rightNavItems = [
  { href: '/projects', label: 'Projects', icon: FolderOpen, testId: 'bottom-nav-projects' },
  { href: '/settings', label: 'Settings', icon: Settings, testId: 'bottom-nav-settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleAddClick = () => {
    if (pathname === '/todos' || pathname.startsWith('/todos/')) {
      // Already on todos page - focus the input
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="New todo title"]'
      )
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        input.focus()
      }
    } else {
      router.push('/todos')
    }
  }

  const renderNavItem = (item: { href: string; label: string; icon: typeof CheckSquare; testId: string }) => {
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
  }

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] sm:hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 0, transparent 30px, var(--bg-surface) 31px)',
      }}
    >
      <div className="flex items-end justify-around py-2">
        {leftNavItems.map(renderNavItem)}

        {/* Center add button */}
        <div className="relative -mt-6">
          <button
            data-testid="bottom-nav-add"
            onClick={handleAddClick}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg"
            style={{ boxShadow: '0 -2px 10px rgba(196, 69, 60, 0.3)' }}
            aria-label="Add todo"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {rightNavItems.map(renderNavItem)}
      </div>
    </nav>
  )
}
