'use client'

import { useEffect } from 'react'
import { useTodoStore } from '@/stores/todo-store'
import { TodoTree } from '@/components/todo/todo-tree'
import { TodoCreateForm } from '@/components/todo/todo-create-form'
import { EmptyState } from '@/components/todo/empty-state'
import { Plus, RefreshCw } from 'lucide-react'

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

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold">Todos</h1>
      </div>

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

      {!loading && !error && todos.length === 0 && <EmptyState />}

      {!loading && todos.length > 0 && <TodoTree todos={todos} />}

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
