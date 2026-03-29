'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, Clock, Calendar, Plus } from 'lucide-react'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { useFilterStore, type FilterType } from '@/stores/filter-store'
import { cn } from '@/lib/utils'

export interface SidebarProps {
  open: boolean
  onClose: () => void
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function isWithinDays(dueDate: string | null, days: number): boolean {
  if (!dueDate) return false
  const today = new Date(getToday())
  const due = new Date(dueDate)
  const diffMs = due.getTime() - today.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= days
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const todos = useTodoStore((s) => s.todos)
  const projects = useProjectStore((s) => s.projects)
  const filterType = useFilterStore((s) => s.filterType)
  const projectId = useFilterStore((s) => s.projectId)
  const setFilter = useFilterStore((s) => s.setFilter)

  const incompleteTodos = useMemo(
    () => todos.filter((t) => !t.completed),
    [todos]
  )

  const allCount = incompleteTodos.length

  const todayCount = useMemo(() => {
    const today = getToday()
    return incompleteTodos.filter((t) => t.dueDate === today).length
  }, [incompleteTodos])

  const upcomingCount = useMemo(
    () => incompleteTodos.filter((t) => isWithinDays(t.dueDate, 7)).length,
    [incompleteTodos]
  )

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of incompleteTodos) {
      if (t.projectId) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1
      }
    }
    return counts
  }, [incompleteTodos])

  const handleFilterClick = (type: FilterType, pid?: string) => {
    setFilter(type, pid)
    if (pathname !== '/todos') {
      router.push('/todos')
    }
    onClose()
  }

  const filters = [
    { type: 'all' as const, label: 'すべて', icon: LayoutGrid, count: allCount, testId: 'filter-all', countTestId: 'filter-all-count' },
    { type: 'today' as const, label: '今日', icon: Clock, count: todayCount, testId: 'filter-today', countTestId: 'filter-today-count' },
    { type: 'upcoming' as const, label: '近日中', icon: Calendar, count: upcomingCount, testId: 'filter-upcoming', countTestId: 'filter-upcoming-count' },
  ]

  const renderSidebarContent = (testIdPrefix?: string) => (
    <nav data-testid={testIdPrefix ? `${testIdPrefix}-sidebar-nav` : 'sidebar-nav'} className="flex h-full flex-col bg-[var(--bg-surface)]">
      {/* Filter section */}
      <div className="space-y-0.5 p-3">
        {filters.map((f) => {
          const isActive = filterType === f.type
          const Icon = f.icon
          return (
            <button
              key={f.type}
              data-testid={testIdPrefix ? `${testIdPrefix}-${f.testId}` : f.testId}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => handleFilterClick(f.type)}
              className={cn(
                'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-[3px] border-[var(--accent)] bg-[var(--bg-raised)] text-[var(--text)]'
                  : 'border-l-[3px] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{f.label}</span>
              <span
                data-testid={testIdPrefix ? `${testIdPrefix}-${f.countTestId}` : f.countTestId}
                className="text-xs text-[var(--text-muted)]"
              >
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Projects section */}
      <div className="flex-1 p-3">
        <div
          className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]"
        >
          PROJECTS
        </div>
        <div className="space-y-0.5">
          {projects.map((p) => {
            const isActive = filterType === 'project' && projectId === p.id
            return (
              <button
                key={p.id}
                data-testid={testIdPrefix ? `${testIdPrefix}-project-${p.id}` : `project-${p.id}`}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => handleFilterClick('project', p.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-l-[3px] border-[var(--accent)] bg-[var(--bg-raised)] text-[var(--text)]'
                    : 'border-l-[3px] border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
                )}
              >
                <span
                  data-testid={testIdPrefix ? `${testIdPrefix}-project-dot-${p.id}` : `project-dot-${p.id}`}
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="flex-1 text-left">{p.name}</span>
                <span
                  data-testid={testIdPrefix ? `${testIdPrefix}-project-count-${p.id}` : `project-count-${p.id}`}
                  className="text-xs text-[var(--text-muted)]"
                >
                  {projectCounts[p.id] || 0}
                </span>
              </button>
            )
          })}
        </div>
        <Link
          href="/projects"
          data-testid={testIdPrefix ? `${testIdPrefix}-add-project-link` : 'add-project-link'}
          className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <Plus className="h-4 w-4" />
          <span>プロジェクト追加</span>
        </Link>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden sm:flex sm:w-60 sm:flex-shrink-0 sm:border-r sm:border-[var(--border)]">
        {renderSidebarContent('desktop')}
      </aside>

      {/* Mobile overlay sidebar */}
      {open && (
        <>
          <div
            data-testid="sidebar-backdrop"
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 sm:hidden">
            {renderSidebarContent()}
          </aside>
        </>
      )}
    </>
  )
}
