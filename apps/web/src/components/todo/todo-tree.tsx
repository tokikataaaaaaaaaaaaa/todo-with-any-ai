'use client'

import { TodoNode } from './todo-node'
import type { Todo } from '@todo-with-any-ai/shared'

interface TodoTreeProps {
  todos: Todo[]
}

export function TodoTree({ todos }: TodoTreeProps) {
  const rootTodos = todos.filter((t) => t.parentId === null)

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {rootTodos.map((todo) => (
        <TodoNode key={todo.id} todo={todo} todos={todos} depth={0} />
      ))}
    </div>
  )
}
