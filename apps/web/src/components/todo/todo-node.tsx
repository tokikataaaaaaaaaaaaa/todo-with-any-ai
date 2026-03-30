'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { PriorityBadge } from './priority-badge'
import { CategoryIcon } from './category-icon'
import { ChildrenProgress } from './children-progress'
import { CompleteConfirmDialog } from './complete-confirm-dialog'
import { CalendarPlus, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { generateICS, downloadICS } from '@/lib/ics-generator'
import { DeleteTodoDialog } from './delete-todo-dialog'
import type { Todo } from '@todo-with-any-ai/shared'

interface TodoNodeProps {
  todo: Todo
  todos: Todo[]
  depth: number
}

function formatTimeRange(startTime?: string | null, endTime?: string | null): string {
  if (startTime && endTime) return ` ${startTime}-${endTime}`
  if (startTime) return ` ${startTime}~`
  if (endTime) return ` ~${endTime}`
  return ''
}

function formatDueDate(
  dueDate: string,
  startTime?: string | null,
  endTime?: string | null,
): { label: string; overdue: boolean; urgent: boolean } {
  const due = new Date(dueDate)
  const now = new Date()

  // Normalize to start of day for comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = dueDay.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  const timeSuffix = formatTimeRange(startTime, endTime)

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue!${timeSuffix}`, overdue: true, urgent: false }
  if (diffDays === 0) return { label: `Today${timeSuffix}`, overdue: false, urgent: true }
  if (diffDays === 1) return { label: `Tomorrow${timeSuffix}`, overdue: false, urgent: true }
  return { label: `${diffDays}d${timeSuffix}`, overdue: false, urgent: false }
}

/** Circular checkbox matching Paper & Ink design */
function CircleCheckbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: () => void
  ariaLabel: string
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
      style={{
        borderColor: checked ? 'var(--accent)' : 'var(--border-strong)',
        background: checked ? 'var(--accent)' : 'transparent',
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.5L5 9L9.5 3.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

export function TodoNode({ todo, todos, depth }: TodoNodeProps) {
  const router = useRouter()
  const toggleComplete = useTodoStore((s) => s.toggleComplete)
  const toggleExpand = useTodoStore((s) => s.toggleExpand)
  const createTodo = useTodoStore((s) => s.createTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const expandedIds = useTodoStore((s) => s.expandedIds)
  const projects = useProjectStore((s) => s.projects)
  const [showChildForm, setShowChildForm] = useState(false)
  const [childTitle, setChildTitle] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  const project = todo.projectId
    ? projects.find((p) => p.id === todo.projectId) ?? null
    : null

  const children = todos.filter((t) => t.parentId === todo.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(todo.id)

  const dueDateInfo = todo.dueDate ? formatDueDate(todo.dueDate, todo.startTime, todo.endTime) : null

  const handleDownloadICS = () => {
    if (!todo.dueDate) return
    const ics = generateICS({
      title: todo.title,
      dueDate: todo.dueDate,
      startTime: todo.startTime,
      endTime: todo.endTime,
    })
    downloadICS(ics, `${todo.title.replace(/[^a-zA-Z0-9\u3040-\u9FFF]/g, '_')}.ics`)
  }

  const [addingChild, setAddingChild] = useState(false)

  const handleAddChild = async () => {
    if (!childTitle.trim() || addingChild) return
    const title = childTitle.trim()
    setChildTitle('')
    setShowChildForm(false)
    if (!expandedIds.has(todo.id)) toggleExpand(todo.id)
    setAddingChild(true)
    try {
    await createTodo({
      title,
      completed: false,
      parentId: todo.id,
      order: children.length,
      depth: todo.depth + 1,
      dueDate: null,
      priority: null,
      categoryIcon: null,
      projectId: todo.projectId ?? null,
      urgencyLevelId: null,
      startTime: null,
      endTime: null,
    })
    } finally {
      setAddingChild(false)
    }
  }

  return (
    <div>
      <div
        data-testid="todo-row"
        className="group flex items-center gap-3 border-b border-[var(--border)] transition-colors duration-150 hover:bg-[var(--bg-raised)]"
        style={{
          padding: '12px 16px',
          paddingLeft: `${depth * 24 + 16}px`,
        }}
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

        {/* Circular checkbox */}
        <CircleCheckbox
          checked={todo.completed}
          onChange={() => {
            const incompleteChildren = children.filter((c) => !c.completed)
            if (!todo.completed && incompleteChildren.length > 0) {
              setShowCompleteConfirm(true)
            } else {
              toggleComplete(todo.id)
            }
          }}
          ariaLabel={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />

        {/* Title */}
        <button
          data-testid={`todo-title-${todo.id}`}
          onClick={() => {
            router.push(`/todos/detail?id=${todo.id}`)
          }}
          className={cn(
            'flex-1 cursor-pointer truncate text-left text-[15px] transition-all duration-200',
            todo.completed && 'text-[var(--text-secondary)] line-through'
          )}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {todo.title}
        </button>

        {/* Children progress */}
        {hasChildren && (
          <ChildrenProgress
            completedCount={children.filter((c) => c.completed).length}
            totalCount={children.length}
          />
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

        {/* Calendar export button */}
        {todo.dueDate && (
          <button
            onClick={handleDownloadICS}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--accent)] sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`カレンダーに追加 "${todo.title}"`}
          >
            <CalendarPlus className="h-3 w-3" />
          </button>
        )}

        {/* Add child button */}
        {depth < 9 && (
          <button
            data-testid={`add-child-${todo.id}`}
            onClick={() => setShowChildForm(!showChildForm)}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--accent)] sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`Add subtask to "${todo.title}"`}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}

        {/* Edit button (visible on hover for desktop, always visible on mobile) */}
        <button
          data-testid={`edit-todo-${todo.id}`}
          onClick={() => {
            router.push(`/todos/detail?id=${todo.id}`)
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--accent)] sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Edit "${todo.title}"`}
        >
          <Pencil className="h-3 w-3" />
        </button>

        {/* Delete button (visible on hover for desktop, always visible on mobile) */}
        <button
          data-testid={`delete-todo-${todo.id}`}
          onClick={() => setShowDeleteDialog(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--error)] sm:opacity-0 sm:group-hover:opacity-100"
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

      {/* Complete confirmation dialog (when parent has incomplete children) */}
      <CompleteConfirmDialog
        open={showCompleteConfirm}
        incompleteCount={children.filter((c) => !c.completed).length}
        onConfirm={() => {
          toggleComplete(todo.id)
          setShowCompleteConfirm(false)
        }}
        onCancel={() => setShowCompleteConfirm(false)}
      />

      {/* Inline child creation form */}
      {showChildForm && (
        <div
          className="flex items-center gap-2 border-b border-[var(--border)] py-2"
          style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}
        >
          <input
            type="text"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) handleAddChild()
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
