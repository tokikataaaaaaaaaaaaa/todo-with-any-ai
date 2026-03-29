'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTodoStore } from '@/stores/todo-store'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { UpdateTodo } from '@todo-with-any-ai/shared'

function TodoDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const todoId = searchParams.get('id')
  const { todos } = useTodoStore()

  const todo = todoId ? todos.find((t) => t.id === todoId) : null

  const handleSave = async (data: UpdateTodo) => {
    if (!todoId) return
    try {
      const { apiClient } = await import('@/lib/api-client')
      await apiClient.updateTodo(todoId, data)
      useTodoStore.setState((state) => ({
        todos: state.todos.map((t) =>
          t.id === todoId ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        ),
      }))
    } catch {
      // Error handling
    }
  }

  const handleDelete = async () => {
    if (!todoId) return
    try {
      const { apiClient } = await import('@/lib/api-client')
      await apiClient.deleteTodo(todoId)
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
        <p className="text-lg text-[var(--text-secondary)]">Todoが見つかりません</p>
        <button
          type="button"
          aria-label="戻る"
          onClick={() => router.back()}
          className="mt-4 text-sm text-[var(--accent)] hover:underline"
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
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-zinc-900"
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

export default function TodoDetailPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-[var(--text-secondary)]">読み込み中...</div>}>
      <TodoDetailContent />
    </Suspense>
  )
}
