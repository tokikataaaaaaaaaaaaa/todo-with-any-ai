'use client'

import { useRouter, useParams } from 'next/navigation'
import { useTodoStore } from '@/stores/todo-store'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { UpdateTodo } from '@todo-with-any-ai/shared'

export default function TodoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const todoId = params.id as string
  const { todos } = useTodoStore()

  const todo = todos.find((t) => t.id === todoId)

  const handleSave = async (data: UpdateTodo) => {
    try {
      const { apiClient: todoClient } = await import('@/lib/api-client')
      await todoClient.updateTodo(todoId, data)
      // Optimistic update in store
      useTodoStore.setState((state) => ({
        todos: state.todos.map((t) =>
          t.id === todoId ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        ),
      }))
    } catch {
      // Error handling - could add toast notification
    }
  }

  const handleDelete = async () => {
    try {
      const { apiClient: todoClient } = await import('@/lib/api-client')
      await todoClient.deleteTodo(todoId)
      useTodoStore.setState((state) => ({
        todos: state.todos.filter((t) => t.id !== todoId),
      }))
      router.push('/todos')
    } catch {
      // Error handling
    }
  }

  if (!todo) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg text-zinc-500">Todoが見つかりません</p>
        <button
          type="button"
          aria-label="戻る"
          onClick={() => router.back()}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          aria-label="戻る"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          戻る
        </button>
        <h1 className="text-lg font-semibold">Todo詳細</h1>
        <div className="w-12" />
      </div>
      <TodoDetailForm
        todo={todo}
        allTodos={todos}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
