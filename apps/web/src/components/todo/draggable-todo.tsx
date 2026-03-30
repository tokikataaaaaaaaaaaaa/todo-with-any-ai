'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Todo } from '@todo-with-any-ai/shared'

export type DropPosition = 'child' | 'before' | 'after'

export interface DraggableTodoProps {
  todo: Todo
  allTodos: Todo[]
  children: React.ReactNode
  onDrop: (draggedId: string, targetId: string, position: DropPosition) => void
}

/**
 * Module-level variable tracking the currently dragged todo ID.
 * This is more reliable than dataTransfer.getData() which is
 * restricted by the drag-and-drop security model in some browsers.
 */
let currentDraggedId: string | null = null

/** Exported for testing */
export function _setCurrentDraggedId(id: string | null) {
  currentDraggedId = id
}

/** Returns all descendant IDs of a given todo */
function getDescendantIds(todoId: string, allTodos: Todo[]): Set<string> {
  const descendants = new Set<string>()
  const queue = [todoId]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    for (const t of allTodos) {
      if (t.parentId === currentId && !descendants.has(t.id)) {
        descendants.add(t.id)
        queue.push(t.id)
      }
    }
  }
  return descendants
}

/** Determine drop position from cursor Y relative to element */
function getDropPosition(clientY: number, rect: DOMRect): DropPosition {
  const relativeY = clientY - rect.top
  const ratio = rect.height > 0 ? relativeY / rect.height : 0.5
  if (ratio < 0.25) return 'before'
  if (ratio > 0.75) return 'after'
  return 'child'
}

export function DraggableTodo({ todo, allTodos, children, onDrop }: DraggableTodoProps) {
  const [dropIndicator, setDropIndicator] = useState<DropPosition | null>(null)
  const isTouchDevice = useMemo(
    () => typeof window !== 'undefined' && (navigator?.maxTouchPoints ?? 0) > 0,
    []
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', todo.id)
      e.dataTransfer.effectAllowed = 'move'
      currentDraggedId = todo.id
    },
    [todo.id]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      const position = getDropPosition(e.clientY, rect)
      setDropIndicator(position)
    },
    []
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setDropIndicator(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDropIndicator(null)

      const draggedId = currentDraggedId || e.dataTransfer.getData('text/plain')
      if (!draggedId || draggedId === todo.id) return

      // Find dragged todo
      const draggedTodo = allTodos.find((t) => t.id === draggedId)
      if (!draggedTodo) return

      // Cross-project check
      if (draggedTodo.projectId !== todo.projectId) return

      // Circular reference check: target cannot be a descendant of dragged
      const descendants = getDescendantIds(draggedId, allTodos)
      if (descendants.has(todo.id)) return

      const rect = e.currentTarget.getBoundingClientRect()
      const position = getDropPosition(e.clientY, rect)

      // Depth limit check for child position
      if (position === 'child' && todo.depth >= 9) return

      onDrop(draggedId, todo.id, position)
    },
    [todo, allTodos, onDrop]
  )

  const handleDragEnd = useCallback(() => {
    currentDraggedId = null
  }, [])

  return (
    <div
      data-testid={`draggable-todo-${todo.id}`}
      draggable={!isTouchDevice}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className="relative"
    >
      {children}
      {dropIndicator && (
        <div
          data-testid="drop-indicator"
          className="pointer-events-none absolute inset-0"
          style={{
            borderTop: dropIndicator === 'before' ? '2px solid var(--accent)' : undefined,
            borderBottom: dropIndicator === 'after' ? '2px solid var(--accent)' : undefined,
            backgroundColor: dropIndicator === 'child' ? 'rgba(var(--accent-rgb, 99, 102, 241), 0.1)' : undefined,
          }}
        />
      )}
    </div>
  )
}
