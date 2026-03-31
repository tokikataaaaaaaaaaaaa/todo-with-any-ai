'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { useSnackbarStore } from '@/stores/snackbar-store'
import { useAuth } from '@/hooks/use-auth'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { Todo, UpdateTodo } from '@todo-with-any-ai/shared'

function TodoDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const todoId = searchParams.get('id')
  const { user, loading: authLoading } = useAuth()
  const storeTodos = useTodoStore((s) => s.todos)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const addMessage = useSnackbarStore((s) => s.addMessage)
  const [todo, setTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (!todoId || authLoading) return

    if (!user) {
      setLoading(false)
      return
    }

    // First try store
    const fromStore = storeTodos.find((t) => t.id === todoId)
    if (fromStore) {
      setTodo(fromStore)
      setLoading(false)
      return
    }

    // Store is empty (page reload) — fetch from API after auth is ready
    const loadTodo = async () => {
      try {
        await fetchTodos()
        const updated = useTodoStore.getState().todos
        const found = updated.find((t) => t.id === todoId)
        setTodo(found ?? null)
      } catch {
        setTodo(null)
      } finally {
        setLoading(false)
      }
    }
    loadTodo()
  }, [todoId, user, authLoading, storeTodos, fetchTodos])

  // Keep todo in sync with store changes
  useEffect(() => {
    if (todoId && storeTodos.length > 0) {
      const found = storeTodos.find((t) => t.id === todoId)
      if (found) setTodo(found)
    }
  }, [storeTodos, todoId])

  const handleSave = async (data: UpdateTodo) => {
    if (!todoId) return
    try {
      const { apiClient } = await import('@/lib/api-client')
      await apiClient.updateTodo(todoId, data)
      const updated = { ...todo!, ...data, updatedAt: new Date().toISOString() }
      setTodo(updated)
      useTodoStore.setState((state) => ({
        todos: state.todos.map((t) => t.id === todoId ? updated : t),
      }))
    } catch {
      addMessage('error', '保存に失敗しました')
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
      addMessage('error', '削除に失敗しました')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-[var(--text-muted)]">読み込み中...</div>
      </div>
    )
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
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          戻る
        </button>
        <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Todo詳細</h1>
        <div className="w-12" />
      </div>
      <TodoDetailForm
        todo={todo}
        allTodos={storeTodos}
        onSave={handleSave}
        onDelete={handleDelete}
        projects={projects}
      />
    </div>
  )
}

export default function TodoDetailPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-[var(--text-muted)]">読み込み中...</div>}>
      <TodoDetailContent />
    </Suspense>
  )
}
