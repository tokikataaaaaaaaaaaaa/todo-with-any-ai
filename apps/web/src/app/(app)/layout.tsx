'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, ClipboardList, Calendar, Menu, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BottomNav } from '@/components/ui/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      // Delay redirect to allow getRedirectResult to complete
      const timeout = setTimeout(() => {
        if (!useAuthStore.getState().user) {
          window.location.href = '/'
        }
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]" data-testid="app-loading">
        <header className="border-b border-[var(--border)] p-4">
          <nav className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-6 w-6 animate-pulse rounded bg-[var(--bg-raised)]" />
          </nav>
        </header>
        <main className="p-4">
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-10 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-10 animate-pulse rounded bg-[var(--bg-raised)]" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/85 backdrop-blur-sm p-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              data-testid="hamburger-button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-[var(--radius-md)] p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/todos" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7.5L6 10.5L11 4"
                    stroke="var(--bg)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Todo with Any AI
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div data-testid="header-nav-icons" className="hidden sm:flex items-center gap-1">
              <Link
                href="/sprints"
                className={`rounded-[var(--radius-md)] p-1.5 transition-colors hover:bg-[var(--bg-raised)] ${pathname === '/sprints' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
              >
                <Zap className="h-5 w-5" data-testid="sprint-icon" />
              </Link>
              <Link
                href="/calendar"
                className={`rounded-[var(--radius-md)] p-1.5 transition-colors hover:bg-[var(--bg-raised)] ${pathname === '/calendar' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
              >
                <Calendar className="h-5 w-5" data-testid="calendar-icon" />
              </Link>
              <Link
                href="/activity"
                className={`rounded-[var(--radius-md)] p-1.5 transition-colors hover:bg-[var(--bg-raised)] ${pathname === '/activity' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
              >
                <ClipboardList className="h-5 w-5" data-testid="activity-icon" />
              </Link>
              <Link
                href="/settings"
                className={`rounded-[var(--radius-md)] p-1.5 transition-colors hover:bg-[var(--bg-raised)] ${pathname === '/settings' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
              >
                <Settings className="h-5 w-5" data-testid="settings-icon" />
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-x-hidden p-4 pb-20 sm:pb-4">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
