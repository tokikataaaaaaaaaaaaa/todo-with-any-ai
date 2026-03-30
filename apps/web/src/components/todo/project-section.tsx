'use client'

import { useState } from 'react'
import { TodoNode } from './todo-node'
import { TodoCreateForm } from './todo-create-form'
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
  const [showAddForm, setShowAddForm] = useState(false)

  const total = todos.length
  const completed = todos.filter((t) => t.completed).length

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
        data-testid="project-section-header"
        className="flex items-center justify-between border-b border-[var(--border)] px-3 py-3 sm:px-4 sm:py-3.5"
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

      {/* Todo items (sorted by order) */}
      <div>
        {[...todos].sort((a, b) => a.order - b.order).map((todo) => (
          <TodoNode key={todo.id} todo={todo} todos={allTodos} depth={0} />
        ))}
      </div>

      {/* Add task - reuse TodoCreateForm with project pre-selected */}
      {showAddForm ? (
        <div className="border-t border-[var(--border)]">
          <TodoCreateForm defaultProjectId={projectId} compact />
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
