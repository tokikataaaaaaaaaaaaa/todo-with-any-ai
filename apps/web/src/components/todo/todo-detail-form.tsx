'use client'

import { useState, useMemo } from 'react'
import type { Todo, UpdateTodo, UrgencyLevel, Project } from '@todo-with-any-ai/shared'

const CATEGORIES = [
  { value: 'work', label: 'work' },
  { value: 'personal', label: 'personal' },
  { value: 'shopping', label: 'shopping' },
  { value: 'health', label: 'health' },
  { value: 'study', label: 'study' },
  { value: 'idea', label: 'idea' },
] as const

interface TodoDetailFormProps {
  todo: Todo
  allTodos: Todo[]
  onSave: (data: UpdateTodo) => void
  onDelete: () => void
  urgencyLevels?: UrgencyLevel[]
  projects?: Project[]
}

export function TodoDetailForm({
  todo,
  allTodos,
  onSave,
  onDelete,
  urgencyLevels = [],
  projects = [],
}: TodoDetailFormProps) {
  const [title, setTitle] = useState(todo.title)
  const [completed, setCompleted] = useState(todo.completed)
  const [categoryIcon, setCategoryIcon] = useState(todo.categoryIcon)
  const [dueDate, setDueDate] = useState(todo.dueDate ?? '')
  const [parentId, setParentId] = useState(todo.parentId ?? '')
  const [urgencyLevelId, setUrgencyLevelId] = useState(todo.urgencyLevelId ?? '')
  const [projectId, setProjectId] = useState(todo.projectId ?? '')
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
      (dueDate || null) !== (todo.dueDate || null) ||
      (parentId || null) !== (todo.parentId || null) ||
      (urgencyLevelId || null) !== (todo.urgencyLevelId || null) ||
      (projectId || null) !== (todo.projectId || null)
    )
  }, [title, completed, categoryIcon, dueDate, parentId, urgencyLevelId, projectId, todo])

  const handleSave = () => {
    onSave({
      title,
      completed,
      categoryIcon: categoryIcon ?? undefined,
      dueDate: dueDate || null,
      parentId: parentId || null,
      urgencyLevelId: urgencyLevelId || null,
      projectId: projectId || null,
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
          className="h-5 w-5 rounded border-[var(--border-strong)]"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border-b border-[var(--border)] bg-transparent py-1 text-lg font-medium outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
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
                    : 'bg-[var(--bg-raised)] text-[var(--text)] hover:bg-[var(--bg-raised)]'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Urgency Level */}
      <div>
        <label htmlFor="urgency-level" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          緊急度
        </label>
        <select
          id="urgency-level"
          aria-label="緊急度"
          value={urgencyLevelId}
          onChange={(e) => setUrgencyLevelId(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        >
          <option value="">なし</option>
          {urgencyLevels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.icon} {level.name}
            </option>
          ))}
        </select>
      </div>

      {/* Project */}
      <div>
        <label htmlFor="project-select" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          プロジェクト
        </label>
        <select
          id="project-select"
          aria-label="プロジェクト"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        >
          <option value="">未分類</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="due-date" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          締切日
        </label>
        <div className="flex items-center gap-2">
          <input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          {dueDate && (
            <button
              type="button"
              aria-label="クリア"
              onClick={() => setDueDate('')}
              className="rounded-lg px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Parent Todo */}
      <div>
        <label htmlFor="parent-todo" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          親Todo
        </label>
        <select
          id="parent-todo"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
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
      <div className="border-t border-[var(--border)] pt-4">
        {!showDeleteConfirm ? (
          <button
            type="button"
            aria-label="削除"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-[var(--error)] transition-colors hover:bg-[var(--accent-light)] dark:border-red-900"
          >
            削除
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--error)]">
              本当に削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="確認"
                onClick={onDelete}
                className="flex-1 rounded-lg bg-[var(--error)] px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                確認
              </button>
              <button
                type="button"
                aria-label="キャンセル"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-raised)]"
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
