'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { PriorityBadge } from './priority-badge'
import { CategoryIcon } from './category-icon'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import type { Todo } from '@todo-with-any-ai/shared'

interface TodoNodeProps {
  todo: Todo
  todos: Todo[]
  depth: number
}

function formatDueDate(dueDate: string): { label: string; overdue: boolean } {
  const due = new Date(dueDate)
  const now = new Date()

  // Normalize to start of day for comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = dueDay.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue!`, overdue: true }
  if (diffDays === 0) return { label: 'Today', overdue: false }
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false }
  return { label: `${diffDays}d`, overdue: false }
}

export function TodoNode({ todo, todos, depth }: TodoNodeProps) {
  const toggleComplete = useTodoStore((s) => s.toggleComplete)
  const toggleExpand = useTodoStore((s) => s.toggleExpand)
  const createTodo = useTodoStore((s) => s.createTodo)
  const expandedIds = useTodoStore((s) => s.expandedIds)
  const [showChildForm, setShowChildForm] = useState(false)
  const [childTitle, setChildTitle] = useState('')

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
        className="flex h-12 items-center gap-2 border-b border-gray-100 dark:border-gray-800"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            data-testid="toggle-expand"
            onClick={() => toggleExpand(todo.id)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
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

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleComplete(todo.id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />

        {/* Title */}
        <button
          data-testid={`todo-title-${todo.id}`}
          onClick={() => {
            window.location.href = `/todos/detail?id=${todo.id}`
          }}
          className={cn(
            'flex-1 cursor-pointer truncate text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 -mx-1',
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
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
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
                ? 'font-medium text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {dueDateInfo.label}
          </span>
        )}
      </div>

      {/* Inline child creation form */}
      {showChildForm && (
        <div
          className="flex items-center gap-2 border-b border-gray-100 py-2 dark:border-gray-800"
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
            className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900"
            autoFocus
            aria-label="New subtask title"
          />
          <button
            onClick={handleAddChild}
            disabled={!childTitle.trim()}
            className="rounded bg-indigo-500 px-2 py-1 text-xs text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            追加
          </button>
          <button
            onClick={() => { setShowChildForm(false); setChildTitle('') }}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
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
