'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useTodoStore } from '@/stores/todo-store'
import { CategoryIcon } from '@/components/todo/category-icon'
import { PriorityBadge } from '@/components/todo/priority-badge'

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export default function ActivityPage() {
  const router = useRouter()
  const todos = useTodoStore((s) => s.todos)

  const todayCompleted = todos.filter(
    (todo) => todo.completed && isToday(todo.updatedAt)
  )

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          aria-label="戻る"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">活動ログ</h1>
      </div>

      {todayCompleted.length > 0 ? (
        <>
          <div
            data-testid="summary-card"
            className="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950"
          >
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              今日の完了: {todayCompleted.length}件
            </p>
          </div>

          <ul className="space-y-2">
            {todayCompleted.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-green-500"
                  data-testid={`check-icon-${todo.id}`}
                />
                {todo.categoryIcon && (
                  <span data-testid={`category-icon-${todo.categoryIcon}`}>
                    <CategoryIcon
                      category={todo.categoryIcon}
                      className="h-4 w-4 text-zinc-500"
                    />
                  </span>
                )}
                <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {todo.title}
                </span>
                {todo.priority && <PriorityBadge priority={todo.priority} />}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            今日の完了タスクはまだありません
          </p>
        </div>
      )}
    </div>
  )
}
