'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { useFilterStore } from '@/stores/filter-store'
import { ProjectSection } from '@/components/todo/project-section'
import { TodoTree } from '@/components/todo/todo-tree'
import { TodoCreateForm } from '@/components/todo/todo-create-form'
import { EmptyState } from '@/components/todo/empty-state'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw } from 'lucide-react'

type SortMode = 'default' | 'dueDate'

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

function TodoSkeleton() {
  return (
    <div className="space-y-1 p-4" data-testid="todo-skeleton">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex h-12 animate-pulse items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--bg-raised)]"
        />
      ))}
    </div>
  )
}

export default function TodosPage() {
  const todos = useTodoStore((s) => s.todos)
  const loading = useTodoStore((s) => s.loading)
  const error = useTodoStore((s) => s.error)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const filterType = useFilterStore((s) => s.filterType)
  const filterProjectId = useFilterStore((s) => s.projectId)
  const [sortMode, setSortMode] = useState<SortMode>('default')

  useEffect(() => {
    fetchTodos()
    fetchProjects()
  }, [fetchTodos, fetchProjects])

  const filteredTodos = useMemo(() => {
    switch (filterType) {
      case 'today': {
        const today = getToday()
        return todos.filter((t) => t.dueDate === today)
      }
      case 'upcoming':
        return todos.filter((t) => isWithinDays(t.dueDate, 7))
      case 'project':
        return todos.filter((t) => t.projectId === filterProjectId)
      case 'all':
      default:
        return todos
    }
  }, [todos, filterType, filterProjectId])

  const headerTitle = useMemo(() => {
    switch (filterType) {
      case 'today':
        return '今日のタスク'
      case 'upcoming':
        return '近日中のタスク'
      case 'project': {
        const project = projects.find((p) => p.id === filterProjectId)
        return project?.name ?? 'タスク'
      }
      case 'all':
      default:
        return 'すべてのタスク'
    }
  }, [filterType, filterProjectId, projects])

  const incompleteCount = useMemo(
    () => filteredTodos.filter((t) => !t.completed).length,
    [filteredTodos]
  )

  /** Group root todos by project for the "all" and default views */
  const projectGroups = useMemo(() => {
    const rootTodos = filteredTodos.filter((t) => t.parentId === null)

    // Build a map: projectId -> root todos
    const groupMap = new Map<string | null, typeof rootTodos>()

    for (const todo of rootTodos) {
      const key = todo.projectId ?? null
      if (!groupMap.has(key)) {
        groupMap.set(key, [])
      }
      groupMap.get(key)!.push(todo)
    }

    // Sort groups: projects first (in project order), then uncategorized last
    const groups: {
      projectId: string | null
      icon: string
      name: string
      color: string
      todos: typeof rootTodos
    }[] = []

    // Add project groups in project order
    for (const project of projects) {
      const projectTodos = groupMap.get(project.id)
      if (projectTodos && projectTodos.length > 0) {
        groups.push({
          projectId: project.id,
          icon: project.emoji,
          name: project.name,
          color: project.color,
          todos: projectTodos,
        })
      }
    }

    // Add uncategorized group
    const uncategorized = groupMap.get(null)
    if (uncategorized && uncategorized.length > 0) {
      groups.push({
        projectId: null,
        icon: '\u{1F4CB}',
        name: '未分類',
        color: 'var(--border-strong)',
        todos: uncategorized,
      })
    }

    return groups
  }, [filteredTodos, projects])

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return
    setSortMode(mode)
    if (mode === 'dueDate') {
      fetchTodos({ sort: 'dueDate' })
    } else {
      fetchTodos()
    }
  }

  /** Whether to show grouped project view (all or default filter) */
  const showGrouped = filterType === 'all' || filterType === undefined

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-10">
      {/* Header */}
      <div className="mb-1">
        <h1
          className="text-[26px] font-bold tracking-wide text-[var(--primary)]"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}
        >
          {headerTitle}
        </h1>
        <p
          className="text-sm text-[var(--text-secondary)]"
          data-testid="incomplete-count"
        >
          {incompleteCount}件の未完了タスクがあります
        </p>
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 pb-4 pt-4">
        <button
          data-testid="sort-default"
          data-active={sortMode === 'default' ? 'true' : 'false'}
          onClick={() => handleSortChange('default')}
          className={cn(
            'rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors',
            sortMode === 'default'
              ? 'bg-[var(--primary)] text-[var(--bg)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          )}
        >
          デフォルト順
        </button>
        <button
          data-testid="sort-dueDate"
          data-active={sortMode === 'dueDate' ? 'true' : 'false'}
          onClick={() => handleSortChange('dueDate')}
          className={cn(
            'rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors',
            sortMode === 'dueDate'
              ? 'bg-[var(--primary)] text-[var(--bg)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          )}
        >
          期限順
        </button>
      </div>

      {loading && <TodoSkeleton />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--error)]/20 bg-[var(--accent-light)] p-4">
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button
            onClick={() => fetchTodos()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--error)] hover:opacity-80"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredTodos.length === 0 && <EmptyState />}

      {/* Grouped project view */}
      {!loading && filteredTodos.length > 0 && showGrouped && (
        <div className="space-y-6" data-stagger>
          {projectGroups.map((group) => (
            <ProjectSection
              key={group.projectId ?? 'uncategorized'}
              icon={group.icon}
              name={group.name}
              accentColor={group.color}
              todos={group.todos}
              allTodos={filteredTodos}
              projectId={group.projectId}
            />
          ))}
        </div>
      )}

      {/* Flat view for filtered modes (today, upcoming, single project) */}
      {!loading && filteredTodos.length > 0 && !showGrouped && (
        <div className="overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-surface)]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <TodoTree todos={filteredTodos} />
        </div>
      )}

      <div className="mt-6">
        <TodoCreateForm />
      </div>

      {/* FAB for mobile */}
      <button
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>(
            'input[aria-label="New todo title"]'
          )
          input?.focus()
        }}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg hover:opacity-90 md:hidden"
        aria-label="Add todo"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
