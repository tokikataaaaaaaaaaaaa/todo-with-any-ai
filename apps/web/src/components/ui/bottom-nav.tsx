'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Calendar, FolderOpen, Settings, Plus } from 'lucide-react'
import { AddTodoModal } from '@/components/todo/add-todo-modal'

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
  const [modalOpen, setModalOpen] = useState(false)

  const handleAddClick = () => {
    setModalOpen(true)
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
    <>
      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Background with notch */}
        <div
          className="relative"
          style={{
            background: `
              radial-gradient(circle at 50% 0, transparent 33px, var(--bg-surface) 35px)
            `,
            paddingTop: '8px',
          }}
        >
          {/* Nav items */}
          <div className="flex items-center justify-around px-2 pb-2">
            {leftNavItems.map(renderNavItem)}
            {/* Spacer for the FAB button */}
            <div data-testid="bottom-nav-spacer" className="w-16" />
            {rightNavItems.map(renderNavItem)}
          </div>
        </div>

        {/* Center FAB button (floats above the footer) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 'calc(100% - 24px)' }}
        >
          <button
            data-testid="bottom-nav-add"
            onClick={handleAddClick}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg"
            style={{ boxShadow: '0 -2px 10px rgba(196, 69, 60, 0.3)' }}
            aria-label="Add todo"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      </nav>

      <AddTodoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
