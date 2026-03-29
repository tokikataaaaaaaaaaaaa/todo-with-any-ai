'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { TodoTree } from '@/components/todo/todo-tree'
import { TodoCreateForm } from '@/components/todo/todo-create-form'
import { EmptyState } from '@/components/todo/empty-state'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw } from 'lucide-react'

type SortMode = 'default' | 'dueDate'

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
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null)

  useEffect(() => {
    fetchTodos()
    fetchProjects()
  }, [fetchTodos, fetchProjects])

  const filteredTodos = useMemo(() => {
    if (filterProjectId === null) return todos
    return todos.filter((t) => t.projectId === filterProjectId)
  }, [todos, filterProjectId])

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return
    setSortMode(mode)
    if (mode === 'dueDate') {
      fetchTodos({ sort: 'dueDate' })
    } else {
      fetchTodos()
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Todos</h1>
      </div>

      <div className="flex gap-2 px-4 pb-3">
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

      {/* Project filter tabs */}
      {projects.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          <button
            data-testid="filter-all"
            data-active={filterProjectId === null ? 'true' : 'false'}
            onClick={() => setFilterProjectId(null)}
            className={cn(
              'whitespace-nowrap rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors',
              filterProjectId === null
                ? 'bg-[var(--primary)] text-[var(--bg)]'
                : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            )}
          >
            全て
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              data-testid={`filter-${p.id}`}
              data-active={filterProjectId === p.id ? 'true' : 'false'}
              onClick={() => setFilterProjectId(p.id)}
              className={cn(
                'whitespace-nowrap rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors',
                filterProjectId === p.id
                  ? 'bg-[var(--primary)] text-[var(--bg)]'
                  : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              )}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      )}

      {loading && <TodoSkeleton />}

      {error && (
        <div className="mx-4 rounded-[var(--radius-lg)] border border-[var(--error)]/20 bg-[var(--accent-light)] p-4">
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

      {!loading && filteredTodos.length > 0 && <TodoTree todos={filteredTodos} />}

      <TodoCreateForm />

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
