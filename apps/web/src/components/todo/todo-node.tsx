'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { PriorityBadge } from './priority-badge'
import { CategoryIcon } from './category-icon'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { DeleteTodoDialog } from './delete-todo-dialog'
import type { Todo } from '@todo-with-any-ai/shared'

interface TodoNodeProps {
  todo: Todo
  todos: Todo[]
  depth: number
}

function formatDueDate(dueDate: string): { label: string; overdue: boolean; urgent: boolean } {
  const due = new Date(dueDate)
  const now = new Date()

  // Normalize to start of day for comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = dueDay.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue!`, overdue: true, urgent: false }
  if (diffDays === 0) return { label: 'Today', overdue: false, urgent: true }
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false, urgent: true }
  return { label: `${diffDays}d`, overdue: false, urgent: false }
}

export function TodoNode({ todo, todos, depth }: TodoNodeProps) {
  const toggleComplete = useTodoStore((s) => s.toggleComplete)
  const toggleExpand = useTodoStore((s) => s.toggleExpand)
  const createTodo = useTodoStore((s) => s.createTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const expandedIds = useTodoStore((s) => s.expandedIds)
  const projects = useProjectStore((s) => s.projects)
  const [showChildForm, setShowChildForm] = useState(false)
  const [childTitle, setChildTitle] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const project = todo.projectId
    ? projects.find((p) => p.id === todo.projectId) ?? null
    : null

  const children = todos.filter((t) => t.parentId === todo.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(todo.id)

  const dueDateInfo = todo.dueDate ? formatDueDate(todo.dueDate) : null

  const handleAddChild = async () => {
    if (!childTitle.trim()) return
    await createTodo({
      title: childTitle.trim(),
      completed: false,
      parentId: todo.id,
      order: children.length,
      depth: todo.depth + 1,
      dueDate: null,
      priority: null,
      categoryIcon: null,
      projectId: todo.projectId ?? null,
      urgencyLevelId: null,
    })
    setChildTitle('')
    setShowChildForm(false)
    // Auto-expand parent to show new child
    if (!expandedIds.has(todo.id)) {
      toggleExpand(todo.id)
    }
  }

  return (
    <div>
      <div
        data-testid="todo-row"
        className="group flex h-12 items-center gap-2 border-b border-[var(--border)]"
        style={
          project
            ? { paddingLeft: `${depth * 24}px`, borderLeft: `3px solid ${project.color}` }
            : { paddingLeft: `${depth * 24}px` }
        }
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            data-testid="toggle-expand"
            onClick={() => toggleExpand(todo.id)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-raised)]"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Category icon */}
        <CategoryIcon category={todo.categoryIcon} />

        {/* Project badge */}
        {project && (
          <span
            data-testid="project-badge"
            className="text-sm"
            title={project.name}
          >
            {project.emoji}
          </span>
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleComplete(todo.id)}
          className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)]"
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />

        {/* Title */}
        <button
          data-testid={`todo-title-${todo.id}`}
          onClick={() => {
            window.location.href = `/todos/detail?id=${todo.id}`
          }}
          className={cn(
            'flex-1 cursor-pointer truncate text-left text-sm hover:bg-[var(--bg-raised)] rounded px-1 -mx-1',
            todo.completed && 'line-through opacity-50'
          )}
        >
          {todo.title}
        </button>

        {/* Add child button */}
        {depth < 9 && (
          <button
            data-testid={`add-child-${todo.id}`}
            onClick={() => setShowChildForm(!showChildForm)}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
            aria-label={`Add subtask to "${todo.title}"`}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}

        {/* Priority badge */}
        <PriorityBadge priority={todo.priority} />

        {/* Due date */}
        {dueDateInfo && (
          <span
            className={cn(
              'whitespace-nowrap text-xs',
              dueDateInfo.overdue
                ? 'font-medium text-[var(--error)]'
                : dueDateInfo.urgent
                  ? 'font-medium text-[var(--warning)]'
                  : 'text-[var(--text-secondary)]'
            )}
          >
            {dueDateInfo.label}
          </span>
        )}

        {/* Delete button (visible on hover) */}
        <button
          data-testid={`delete-todo-${todo.id}`}
          onClick={() => setShowDeleteDialog(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--error)] group-hover:opacity-100 sm:opacity-0"
          aria-label={`Delete "${todo.title}"`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteTodoDialog
        open={showDeleteDialog}
        todoTitle={todo.title}
        childCount={children.length}
        onConfirm={async () => {
          await deleteTodo(todo.id)
          setShowDeleteDialog(false)
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Inline child creation form */}
      {showChildForm && (
        <div
          className="flex items-center gap-2 border-b border-[var(--border)] py-2"
          style={{ paddingLeft: `${(depth + 1) * 24}px` }}
        >
          <input
            type="text"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChild()
              if (e.key === 'Escape') { setShowChildForm(false); setChildTitle('') }
            }}
            placeholder="サブタスクを入力..."
            className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
            autoFocus
            aria-label="New subtask title"
          />
          <button
            onClick={handleAddChild}
            disabled={!childTitle.trim()}
            className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white hover:bg-[var(--accent)] disabled:opacity-50"
          >
            追加
          </button>
          <button
            onClick={() => { setShowChildForm(false); setChildTitle('') }}
            className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
          >
            取消
          </button>
        </div>
      )}

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TodoNode
              key={child.id}
              todo={child}
              todos={todos}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
