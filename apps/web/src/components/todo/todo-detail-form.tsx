'use client'

import { useState, useMemo } from 'react'
import type { Todo, UpdateTodo } from '@todo-with-any-ai/shared'

const CATEGORIES = [
  { value: 'work', label: 'work' },
  { value: 'personal', label: 'personal' },
  { value: 'shopping', label: 'shopping' },
  { value: 'health', label: 'health' },
  { value: 'study', label: 'study' },
  { value: 'idea', label: 'idea' },
] as const

const PRIORITIES = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
  { value: null, label: 'なし' },
] as const

interface TodoDetailFormProps {
  todo: Todo
  allTodos: Todo[]
  onSave: (data: UpdateTodo) => void
  onDelete: () => void
}

export function TodoDetailForm({ todo, allTodos, onSave, onDelete }: TodoDetailFormProps) {
  const [title, setTitle] = useState(todo.title)
  const [completed, setCompleted] = useState(todo.completed)
  const [categoryIcon, setCategoryIcon] = useState(todo.categoryIcon)
  const [priority, setPriority] = useState(todo.priority)
  const [dueDate, setDueDate] = useState(todo.dueDate ?? '')
  const [parentId, setParentId] = useState(todo.parentId ?? '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const parentOptions = useMemo(
    () => allTodos.filter((t) => t.id !== todo.id),
    [allTodos, todo.id]
  )

  const hasChanges = useMemo(() => {
    return (
      title !== todo.title ||
      completed !== todo.completed ||
      categoryIcon !== todo.categoryIcon ||
      priority !== todo.priority ||
      (dueDate || null) !== (todo.dueDate || null) ||
      (parentId || null) !== (todo.parentId || null)
    )
  }, [title, completed, categoryIcon, priority, dueDate, parentId, todo])

  const handleSave = () => {
    onSave({
      title,
      completed,
      categoryIcon: categoryIcon ?? undefined,
      priority: priority ?? undefined,
      dueDate: dueDate || null,
      parentId: parentId || null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Completed + Title */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => setCompleted(e.target.checked)}
          className="h-5 w-5 rounded border-zinc-300"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border-b border-zinc-200 bg-transparent py-1 text-lg font-medium outline-none focus:border-[var(--color-primary)] dark:border-zinc-700"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          カテゴリ
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = categoryIcon === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                role="button"
                aria-label={cat.label}
                data-selected={selected ? 'true' : 'false'}
                onClick={() => setCategoryIcon(selected ? null : cat.value)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selected
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          優先度
        </label>
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {PRIORITIES.map((p) => {
            const selected = priority === p.value
            return (
              <button
                key={p.label}
                type="button"
                role="button"
                aria-label={p.label}
                data-selected={selected ? 'true' : 'false'}
                onClick={() => setPriority(p.value)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="due-date" className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          締切日
        </label>
        <div className="flex items-center gap-2">
          <input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] dark:border-zinc-700"
          />
          {dueDate && (
            <button
              type="button"
              aria-label="クリア"
              onClick={() => setDueDate('')}
              className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Parent Todo */}
      <div>
        <label htmlFor="parent-todo" className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          親Todo
        </label>
        <select
          id="parent-todo"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] dark:border-zinc-700"
        >
          <option value="">なし</option>
          {parentOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <button
        type="button"
        disabled={!hasChanges}
        onClick={handleSave}
        className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        保存する
      </button>

      {/* Delete */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        {!showDeleteConfirm ? (
          <button
            type="button"
            aria-label="削除"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            削除
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              本当に削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="確認"
                onClick={onDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                確認
              </button>
              <button
                type="button"
                aria-label="キャンセル"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
