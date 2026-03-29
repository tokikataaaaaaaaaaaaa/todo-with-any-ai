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
          className="flex h-12 animate-pulse items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800"
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
        <h1 className="text-2xl font-bold">Todos</h1>
      </div>

      <div className="flex gap-2 px-4 pb-3">
        <button
          data-testid="sort-default"
          data-active={sortMode === 'default' ? 'true' : 'false'}
          onClick={() => handleSortChange('default')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            sortMode === 'default'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          デフォルト順
        </button>
        <button
          data-testid="sort-dueDate"
          data-active={sortMode === 'dueDate' ? 'true' : 'false'}
          onClick={() => handleSortChange('dueDate')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            sortMode === 'dueDate'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              filterProjectId === null
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filterProjectId === p.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      )}

      {loading && <TodoSkeleton />}

      {error && (
        <div className="mx-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => fetchTodos()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 md:hidden"
        aria-label="Add todo"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
