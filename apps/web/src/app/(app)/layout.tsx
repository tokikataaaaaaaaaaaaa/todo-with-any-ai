'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Settings, ClipboardList } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()

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
      <div className="min-h-screen" data-testid="app-loading">
        <header className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <nav className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </nav>
        </header>
        <main className="p-4">
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="font-bold tracking-tight">todo-with-any-ai</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/activity"
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ClipboardList className="h-5 w-5" data-testid="activity-icon" />
            </Link>
            <Link
              href="/settings"
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Settings className="h-5 w-5" data-testid="settings-icon" />
            </Link>
          </div>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
