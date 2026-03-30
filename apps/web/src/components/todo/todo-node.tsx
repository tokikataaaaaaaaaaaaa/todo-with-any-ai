'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { DraggableTodo } from './draggable-todo'
import type { DropPosition } from './draggable-todo'
import { PriorityBadge } from './priority-badge'
import { CategoryIcon } from './category-icon'
import { useUrgencyLevelStore } from '@/stores/urgency-level-store'
import { ChildrenProgress } from './children-progress'
import { CompleteConfirmDialog } from './complete-confirm-dialog'
import { ArrowDown, ArrowUp, CalendarPlus, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
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

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d!${timeSuffix}`, overdue: true, urgent: false }
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
  const moveTodo = useTodoStore((s) => s.moveTodo)
  const expandedIds = useTodoStore((s) => s.expandedIds)
  const projects = useProjectStore((s) => s.projects)
  const urgencyLevels = useUrgencyLevelStore((s) => s.levels)
  const [showChildForm, setShowChildForm] = useState(false)
  const [childTitle, setChildTitle] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  // SP swipe-to-delete state
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)

  // SP long-press context menu state
  const [showContextMenu, setShowContextMenu] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchMovedRef = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (todo.completed) return
    const touch = e.touches[0]
    startXRef.current = touch.clientX
    startYRef.current = touch.clientY
    setIsSwiping(false)
    touchMovedRef.current = false

    // Start long-press timer
    longPressTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) {
        setShowContextMenu(true)
      }
    }, 500)
  }, [todo.completed])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (todo.completed) return
    const touch = e.touches[0]
    const diff = startXRef.current - touch.clientX
    const verticalDiff = Math.abs(touch.clientY - startYRef.current)

    // If finger moved significantly, cancel long-press
    if (Math.abs(diff) > 10 || verticalDiff > 10) {
      touchMovedRef.current = true
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    // Only handle left swipe (positive diff)
    if (diff > 0) {
      setIsSwiping(true)
      setSwipeX(Math.min(diff, 80))
    }
  }, [todo.completed])

  const handleTouchEnd = useCallback(() => {
    // Cancel long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (swipeX > 40) {
      // Keep delete button visible
      setSwipeX(80)
    } else {
      setSwipeX(0)
    }
    setIsSwiping(false)
  }, [swipeX])

  const project = todo.projectId
    ? projects.find((p) => p.id === todo.projectId) ?? null
    : null

  const children = todos.filter((t) => t.parentId === todo.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(todo.id)

  // Siblings for move up/down in context menu
  const siblings = todos
    .filter((t) => t.parentId === todo.parentId)
    .sort((a, b) => a.order - b.order)

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

  const handleDrop = (draggedId: string, targetId: string, position: DropPosition) => {
    moveTodo(draggedId, targetId, position)
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
      description: null,
    })
    } finally {
      setAddingChild(false)
    }
  }

  return (
    <DraggableTodo todo={todo} allTodos={todos} onDrop={handleDrop}>
    <div>
      {/* Swipe container - relative positioning for delete button reveal */}
      <div className="relative overflow-hidden">
        {/* Main todo row - slides left on swipe */}
        <div
          data-testid="todo-row"
          className="group relative flex items-center gap-3 border-b border-[var(--border)] transition-colors duration-150 hover:bg-[var(--bg-raised)]"
          style={{
            padding: '12px 16px',
            paddingLeft: `${depth * 24 + 16}px`,
            transform: swipeX > 0 ? `translateX(-${swipeX}px)` : undefined,
            transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <button
              data-testid="toggle-expand"
              onClick={(e) => { e.stopPropagation(); toggleExpand(todo.id) }}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded hover:bg-[var(--bg-raised)]"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
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

          {/* Title area - tappable for navigation on both SP and desktop */}
          <button
            data-testid={`todo-title-${todo.id}`}
            onClick={() => {
              if (!showContextMenu) {
                router.push(`/todos/detail?id=${todo.id}`)
              }
            }}
            className={cn(
              'min-w-0 flex-1 cursor-pointer text-left text-[15px] transition-all duration-200',
              'line-clamp-3 sm:truncate sm:line-clamp-none',
              todo.completed && 'text-[var(--text-secondary)] line-through'
            )}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {todo.title}
          </button>

          {/* Children progress - hidden on SP to reduce clutter */}
          {hasChildren && (
            <div data-testid="children-progress-wrapper" className="hidden sm:inline-flex">
              <ChildrenProgress
                completedCount={children.filter((c) => c.completed).length}
                totalCount={children.length}
              />
            </div>
          )}

          {/* Priority badge */}
          <PriorityBadge priority={todo.priority} urgencyLevelId={todo.urgencyLevelId} urgencyLevels={urgencyLevels} />

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

          {/* Action buttons - hidden for completed todos */}
          {!todo.completed && (
            <>
              {/* Calendar export button - hidden on SP */}
              {todo.dueDate && (
                <button
                  onClick={handleDownloadICS}
                  className="hidden sm:flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                  aria-label={`カレンダーに追加 "${todo.title}"`}
                >
                  <CalendarPlus className="h-3 w-3" />
                </button>
              )}

              {/* Add child button - hidden on SP */}
              {depth < 9 && (
                <button
                  data-testid={`add-child-${todo.id}`}
                  onClick={() => setShowChildForm(!showChildForm)}
                  className="hidden sm:flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                  aria-label={`Add subtask to "${todo.title}"`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}

              {/* Edit button - hidden on SP, hover on desktop */}
              <button
                data-testid={`edit-todo-${todo.id}`}
                onClick={() => {
                  router.push(`/todos/detail?id=${todo.id}`)
                }}
                className="hidden sm:flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                aria-label={`Edit "${todo.title}"`}
              >
                <Pencil className="h-3 w-3" />
              </button>

              {/* Delete button - hidden on SP, hover on desktop */}
              <button
                data-testid={`delete-todo-${todo.id}`}
                onClick={() => setShowDeleteDialog(true)}
                className="hidden sm:flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[var(--accent-light)] hover:text-[var(--error)]"
                aria-label={`Delete "${todo.title}"`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>

        {/* Swipe-to-delete: Red delete area revealed on left swipe (SP only) */}
        {swipeX > 0 && !todo.completed && (
          <button
            data-testid={`swipe-delete-${todo.id}`}
            onClick={() => {
              setSwipeX(0)
              setShowDeleteDialog(true)
            }}
            className="absolute right-0 top-0 bottom-0 flex w-20 items-center justify-center"
            style={{ backgroundColor: 'var(--error)' }}
            aria-label={`Delete "${todo.title}"`}
          >
            <Trash2 className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* SP Context menu (long press) */}
      {showContextMenu && !todo.completed && (
        <>
          {/* Overlay to close */}
          <div
            data-testid="context-menu-overlay"
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />
          <div
            data-testid={`context-menu-${todo.id}`}
            className="fixed left-1/2 top-1/2 z-50 w-56 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] shadow-lg"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {/* Move up */}
            <button
              onClick={() => {
                const idx = siblings.findIndex((s) => s.id === todo.id)
                if (idx > 0) {
                  moveTodo(todo.id, siblings[idx - 1].id, 'before')
                }
                setShowContextMenu(false)
              }}
              disabled={siblings.findIndex((s) => s.id === todo.id) === 0}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-raised)] disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
              上に移動
            </button>
            {/* Move down */}
            <button
              onClick={() => {
                const idx = siblings.findIndex((s) => s.id === todo.id)
                if (idx < siblings.length - 1) {
                  moveTodo(todo.id, siblings[idx + 1].id, 'after')
                }
                setShowContextMenu(false)
              }}
              disabled={siblings.findIndex((s) => s.id === todo.id) === siblings.length - 1}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-raised)] disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
              下に移動
            </button>
            {/* Separator */}
            <div className="mx-3 border-t border-[var(--border)]" />
            {/* Edit */}
            <button
              onClick={() => {
                setShowContextMenu(false)
                router.push(`/todos/detail?id=${todo.id}`)
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-raised)]"
            >
              <Pencil className="h-4 w-4" />
              編集
            </button>
            {/* Delete */}
            <button
              onClick={() => {
                setShowContextMenu(false)
                setShowDeleteDialog(true)
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bg-raised)]"
              style={{ color: 'var(--error)' }}
            >
              <Trash2 className="h-4 w-4" />
              削除
            </button>
          </div>
        </>
      )}

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
          {[...children].sort((a, b) => a.order - b.order).map((child) => (
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
    </DraggableTodo>
  )
}
