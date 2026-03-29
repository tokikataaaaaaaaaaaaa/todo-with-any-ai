import { Hono } from 'hono'
import { createTodoSchema, updateTodoSchema } from '@todo-with-any-ai/shared'
import { TodoService } from '../services/todo-service'

type Env = {
  Variables: {
    userId: string
  }
}

// TodoService instance will be injected via the factory or set externally
let todoServiceInstance: TodoService | null = null

export function setTodoService(service: TodoService) {
  todoServiceInstance = service
}

export function getTodoService(): TodoService {
  if (!todoServiceInstance) {
    throw new Error('TodoService not initialized. Call setTodoService() first.')
  }
  return todoServiceInstance
}

const todosRoute = new Hono<Env>()

// GET /api/todos - List todos
todosRoute.get('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()

  const completedParam = c.req.query('completed')
  const parentIdParam = c.req.query('parentId')
  const sortParam = c.req.query('sort')
  const dueBeforeParam = c.req.query('dueBefore')

  const filters: {
    completed?: boolean
    parentId?: string | null
    sort?: 'order' | 'dueDate'
    dueBefore?: string
  } = {}

  if (completedParam !== undefined) {
    filters.completed = completedParam === 'true'
  }
  if (parentIdParam !== undefined) {
    filters.parentId = parentIdParam === 'null' ? null : parentIdParam
  }
  if (sortParam === 'dueDate' || sortParam === 'order') {
    filters.sort = sortParam
  }
  if (dueBeforeParam !== undefined) {
    filters.dueBefore = dueBeforeParam
  }

  const todos = await service.listTodos(userId, Object.keys(filters).length > 0 ? filters : undefined)
  return c.json(todos)
})

// GET /api/todos/tree - Get tree structure
todosRoute.get('/tree', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()

  const tree = await service.getTodoTree(userId)
  return c.json(tree)
})

// GET /api/todos/:id/children-count - Get children count for delete confirmation
todosRoute.get('/:id/children-count', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()
  const todoId = c.req.param('id')

  const count = await service.getChildrenCount(userId, todoId)
  return c.json({ count })
})

// GET /api/todos/:id - Get single todo
todosRoute.get('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()
  const todoId = c.req.param('id')

  const todo = await service.getTodo(userId, todoId)
  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404)
  }
  return c.json(todo)
})

// POST /api/todos - Create todo
todosRoute.post('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Validate with zod schema
  const parsed = createTodoSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  try {
    const todo = await service.createTodo(userId, parsed.data)
    return c.json(todo, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 400)
  }
})

// PATCH /api/todos/:id - Update todo
todosRoute.patch('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()
  const todoId = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const parsed = updateTodoSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  const todo = await service.updateTodo(userId, todoId, parsed.data)
  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404)
  }
  return c.json(todo)
})

// DELETE /api/todos/:id - Delete todo
todosRoute.delete('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()
  const todoId = c.req.param('id')

  const count = await service.deleteTodo(userId, todoId)
  if (count === 0) {
    return c.json({ error: 'Todo not found' }, 404)
  }
  return c.body(null, 204)
})

// POST /api/todos/:id/toggle - Toggle complete
todosRoute.post('/:id/toggle', async (c) => {
  const userId = c.get('userId') as string
  const service = getTodoService()
  const todoId = c.req.param('id')

  const todo = await service.toggleComplete(userId, todoId)
  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404)
  }
  return c.json(todo)
})

export { todosRoute }
