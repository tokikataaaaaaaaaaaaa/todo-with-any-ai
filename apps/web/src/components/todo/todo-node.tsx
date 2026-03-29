'use client'

import { cn } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { PriorityBadge } from './priority-badge'
import { CategoryIcon } from './category-icon'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
  const expandedIds = useTodoStore((s) => s.expandedIds)

  const children = todos.filter((t) => t.parentId === todo.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(todo.id)

  const dueDateInfo = todo.dueDate ? formatDueDate(todo.dueDate) : null

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
        <span
          className={cn(
            'flex-1 truncate text-sm',
            todo.completed && 'line-through opacity-50'
          )}
        >
          {todo.title}
        </span>

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
