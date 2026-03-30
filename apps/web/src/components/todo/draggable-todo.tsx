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

function getDropPosition(clientY: number, rect: DOMRect): DropPosition {
  const relativeY = clientY - rect.top
  const ratio = rect.height > 0 ? relativeY / rect.height : 0.5
  if (ratio < 0.25) return 'before'
  if (ratio > 0.75) return 'after'
  return 'child'
}

/**
 * Simple approach: always draggable, drag starts from anywhere.
 * The drag handle in TodoNode is purely visual — any part of the row can initiate drag.
 */
export function DraggableTodo({ todo, allTodos, children, onDrop }: DraggableTodoProps) {
  const [dropIndicator, setDropIndicator] = useState<DropPosition | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.dataTransfer.setData('text/plain', todo.id)
      e.dataTransfer.effectAllowed = 'move'
      currentDraggedId = todo.id
      console.log('[D&D] dragStart:', todo.id, todo.title)
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
      console.log('[D&D] drop:', { draggedId, targetId: todo.id })
      if (!draggedId || draggedId === todo.id) return

      const draggedTodo = allTodos.find((t) => t.id === draggedId)
      if (!draggedTodo) return

      if (draggedTodo.projectId !== todo.projectId) return

      const descendants = getDescendantIds(draggedId, allTodos)
      if (descendants.has(todo.id)) return

      const rect = e.currentTarget.getBoundingClientRect()
      const position = getDropPosition(e.clientY, rect)

      if (position === 'child' && todo.depth >= 9) return

      console.log('[D&D] calling onDrop:', { draggedId, targetId: todo.id, position })
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
