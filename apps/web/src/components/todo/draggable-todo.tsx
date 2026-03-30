'use client'

import { useState, useCallback } from 'react'
import type { Todo } from '@todo-with-any-ai/shared'

export type DropPosition = 'child' | 'before' | 'after'

export interface DraggableTodoProps {
  todo: Todo
  allTodos: Todo[]
  children: React.ReactNode
  onDrop: (draggedId: string, targetId: string, position: DropPosition) => void
}

let currentDraggedId: string | null = null

export function _setCurrentDraggedId(id: string | null) {
  currentDraggedId = id
}

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

/**
 * Approximate height of a single todo row in pixels.
 * The DraggableTodo wrapper may be much taller when children are expanded.
 * We use this to define fixed-pixel zones so that the "before"/"after"
 * drop targets remain usable regardless of how many children are expanded.
 */
const ROW_HEIGHT_PX = 48

function getDropPosition(clientY: number, rect: DOMRect): DropPosition {
  const relativeY = clientY - rect.top
  // Top zone: "before" (insert as sibling above)
  if (relativeY < ROW_HEIGHT_PX * 0.33) return 'before'
  // Bottom zone: "after" (insert as sibling below)
  // For tall wrappers (expanded children), anything below the row area is "after"
  if (relativeY > ROW_HEIGHT_PX * 0.67) return 'after'
  // Middle zone: "child" (nest inside this todo)
  return 'child'
}

/**
 * Simple approach: always draggable, drag starts from anywhere.
 * The drag handle in TodoNode is purely visual — any part of the row can initiate drag.
 */
function dlog(...args: unknown[]) {
  console.log(...args)
}

export function DraggableTodo({ todo, allTodos, children, onDrop }: DraggableTodoProps) {
  const [dropIndicator, setDropIndicator] = useState<DropPosition | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.dataTransfer.setData('text/plain', todo.id)
      e.dataTransfer.effectAllowed = 'move'
      currentDraggedId = todo.id
      dlog('[D&D] dragStart:', todo.id, todo.title)
    },
    [todo.id, todo.title]
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
      dlog('[D&D] drop:', { draggedId, targetId: todo.id, targetTitle: todo.title })
      if (!draggedId || draggedId === todo.id) { dlog('[D&D] SKIP: same or no id'); return }

      const draggedTodo = allTodos.find((t) => t.id === draggedId)
      if (!draggedTodo) { dlog('[D&D] SKIP: dragged not found in allTodos, len=', allTodos.length); return }

      // Cross-project check: resolve effective projectId by walking up parents
      const getEffectiveProjectId = (t: Todo): string | null => {
        if (t.projectId) return t.projectId
        if (t.parentId) {
          const parent = allTodos.find(p => p.id === t.parentId)
          if (parent) return getEffectiveProjectId(parent)
        }
        return null
      }
      const draggedProjectId = getEffectiveProjectId(draggedTodo)
      const targetProjectId = getEffectiveProjectId(todo)
      if (draggedProjectId !== targetProjectId) { dlog('[D&D] SKIP: cross-project', draggedProjectId, '!=', targetProjectId); return }

      const descendants = getDescendantIds(draggedId, allTodos)
      if (descendants.has(todo.id)) { dlog('[D&D] SKIP: circular ref'); return }

      const rect = e.currentTarget.getBoundingClientRect()
      const position = getDropPosition(e.clientY, rect)

      if (position === 'child' && todo.depth >= 9) { dlog('[D&D] SKIP: depth limit'); return }

      dlog('[D&D] onDrop:', { draggedId, targetId: todo.id, position })
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
      draggable={true}
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
            borderTop: dropIndicator === 'before' ? '3px solid var(--accent)' : undefined,
            borderBottom: dropIndicator === 'after' ? '3px solid var(--accent)' : undefined,
            backgroundColor: dropIndicator === 'child' ? 'rgba(196, 69, 60, 0.08)' : undefined,
          }}
        />
      )}
    </div>
  )
}
