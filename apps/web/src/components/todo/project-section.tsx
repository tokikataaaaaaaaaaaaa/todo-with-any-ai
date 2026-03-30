'use client'

import { useState } from 'react'
import { TodoNode } from './todo-node'
import { useTodoStore } from '@/stores/todo-store'
import type { Todo } from '@todo-with-any-ai/shared'

interface ProjectSectionProps {
  icon: string
  name: string
  accentColor: string
  todos: Todo[]
  allTodos: Todo[]
  projectId: string | null
}

export function ProjectSection({
  icon,
  name,
  accentColor,
  todos,
  allTodos,
  projectId,
}: ProjectSectionProps) {
  const createTodo = useTodoStore((s) => s.createTodo)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const total = todos.length
  const completed = todos.filter((t) => t.completed).length

  const handleAdd = async () => {
    if (!newTitle.trim() || adding) return
    const title = newTitle.trim()
    setNewTitle('')
    setShowAddForm(false)
    setAdding(true)
    try {
    await createTodo({
      title,
      completed: false,
      parentId: null,
      order: todos.length,
      depth: 0,
      dueDate: null,
      priority: null,
      categoryIcon: null,
      projectId: projectId,
      urgencyLevelId: null,
      startTime: null,
      endTime: null,
    })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      data-testid={`project-section-${projectId ?? 'uncategorized'}`}
      className="overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-surface)]"
      style={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span
            className="text-base font-bold tracking-wide text-[var(--primary)]"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}
          >
            {name}
          </span>
        </div>
        <span
          className="text-[13px] text-[var(--text-secondary)]"
          style={{ fontFamily: 'var(--font-body)' }}
          data-testid="project-progress"
        >
          {completed}/{total}
        </span>
      </div>

      {/* Todo items */}
      <div>
        {todos.map((todo) => (
          <TodoNode key={todo.id} todo={todo} todos={allTodos} depth={0} />
        ))}
      </div>

      {/* Add task button / inline form */}
      {showAddForm ? (
        <div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) handleAdd()
              if (e.key === 'Escape') { setShowAddForm(false); setNewTitle('') }
            }}
            placeholder="タスク名を入力..."
            className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
            autoFocus
            aria-label="New task title"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            追加
          </button>
          <button
            onClick={() => { setShowAddForm(false); setNewTitle('') }}
            className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          data-testid={`add-task-${projectId ?? 'uncategorized'}`}
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <span className="text-lg leading-none">+</span>
          <span>タスクを追加</span>
        </button>
      )}
    </div>
  )
}
