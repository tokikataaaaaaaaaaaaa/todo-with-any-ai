'use client'

import { useState } from 'react'
import { DraggableTodo } from '@/components/todo/draggable-todo'
import type { DropPosition } from '@/components/todo/draggable-todo'
import type { Todo } from '@todo-with-any-ai/shared'

const makeTodo = (id: string, title: string, parentId: string | null, depth: number, order: number): Todo => ({
  id, title, completed: false, dueDate: null, startTime: null, endTime: null,
  parentId, order, depth, projectId: 'proj-1', priority: null, urgencyLevelId: null,
  categoryIcon: null, description: null, createdAt: '', updatedAt: '',
})

export default function TestDnDPage() {
  const [todos, setTodos] = useState<Todo[]>([
    makeTodo('a', 'Parent A', null, 0, 0),
    makeTodo('b', 'Parent B', null, 0, 1),
    makeTodo('c', 'Child C (of A)', 'a', 1, 0),
    makeTodo('d', 'Child D (of A)', 'a', 1, 1),
  ])
  const [logs, setLogs] = useState<string[]>([])

  const handleDrop = (draggedId: string, targetId: string, position: DropPosition) => {
    const msg = `DROP: ${draggedId} → ${targetId} (${position})`
    console.log(msg)
    setLogs(prev => [...prev, msg])

    const dragged = todos.find(t => t.id === draggedId)
    const target = todos.find(t => t.id === targetId)
    if (!dragged || !target) return

    if (position === 'child') {
      setTodos(prev => prev.map(t => t.id === draggedId ? { ...t, parentId: targetId, depth: target.depth + 1 } : t))
    } else {
      const newParentId = target.parentId
      setTodos(prev => prev.map(t => t.id === draggedId ? { ...t, parentId: newParentId, depth: target.depth } : t))
    }
  }

  const roots = todos.filter(t => t.parentId === null).sort((a, b) => a.order - b.order)

  const renderTodo = (todo: Todo, depth: number) => {
    const children = todos.filter(t => t.parentId === todo.id).sort((a, b) => a.order - b.order)
    return (
      <DraggableTodo key={todo.id} todo={todo} allTodos={todos} onDrop={handleDrop}>
        <div style={{ paddingLeft: depth * 24, padding: '8px', border: '1px solid #333', margin: '2px 0', background: depth === 0 ? '#1a1a2e' : '#2a2a3e' }}>
          <strong>{todo.title}</strong> (id={todo.id}, parent={todo.parentId ?? 'null'}, depth={todo.depth})
        </div>
        {children.map(child => renderTodo(child, depth + 1))}
      </DraggableTodo>
    )
  }

  return (
    <div style={{ padding: 20, color: '#eee', background: '#111', minHeight: '100vh' }}>
      <h1>D&D Test Page</h1>
      <p>Drag Child C or D onto Parent B to test child→sibling promotion</p>
      <div style={{ marginTop: 20 }}>
        {roots.map(r => renderTodo(r, 0))}
      </div>
      <div style={{ marginTop: 20, padding: 10, background: '#222', borderRadius: 8 }}>
        <h3>Drop Logs:</h3>
        {logs.length === 0 && <p style={{ color: '#666' }}>No drops yet</p>}
        {logs.map((l, i) => <div key={i} style={{ color: '#0f0', fontFamily: 'monospace', fontSize: 12 }}>{l}</div>)}
      </div>
    </div>
  )
}
