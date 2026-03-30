import { Hono } from 'hono'
import { createSprintSchema, updateSprintSchema } from '@todo-with-any-ai/shared'
import { SprintService } from '../services/sprint-service'

type Env = {
  Variables: {
    userId: string
  }
}

let sprintServiceInstance: SprintService | null = null

export function setSprintService(service: SprintService) {
  sprintServiceInstance = service
}

export function getSprintService(): SprintService {
  if (!sprintServiceInstance) {
    throw new Error('SprintService not initialized. Call setSprintService() first.')
  }
  return sprintServiceInstance
}

const sprintsRoute = new Hono<Env>()

// Guard: ensure userId is set
sprintsRoute.use('*', async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})
sprintsRoute.use('/', async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// GET /api/sprints
sprintsRoute.get('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()

  const sprints = await service.listSprints(userId)
  return c.json(sprints)
})

// POST /api/sprints
sprintsRoute.post('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const parsed = createSprintSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  try {
    const sprint = await service.createSprint(userId, parsed.data)
    return c.json(sprint, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 400)
  }
})

// GET /api/sprints/:id
sprintsRoute.get('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()
  const sprintId = c.req.param('id')

  const sprint = await service.getSprint(userId, sprintId)
  if (!sprint) {
    return c.json({ error: 'Sprint not found' }, 404)
  }
  return c.json(sprint)
})

// PATCH /api/sprints/:id
sprintsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()
  const sprintId = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const parsed = updateSprintSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  const sprint = await service.updateSprint(userId, sprintId, parsed.data)
  if (!sprint) {
    return c.json({ error: 'Sprint not found' }, 404)
  }
  return c.json(sprint)
})

// DELETE /api/sprints/:id
sprintsRoute.delete('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()
  const sprintId = c.req.param('id')

  const count = await service.deleteSprint(userId, sprintId)
  if (count === 0) {
    return c.json({ error: 'Sprint not found' }, 404)
  }
  return c.body(null, 204)
})

// POST /api/sprints/:id/todos/:todoId - Add todo to sprint
sprintsRoute.post('/:id/todos/:todoId', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()
  const sprintId = c.req.param('id')
  const todoId = c.req.param('todoId')

  const sprint = await service.addTodoToSprint(userId, sprintId, todoId)
  if (!sprint) {
    return c.json({ error: 'Sprint not found' }, 404)
  }
  return c.json(sprint)
})

// DELETE /api/sprints/:id/todos/:todoId - Remove todo from sprint
sprintsRoute.delete('/:id/todos/:todoId', async (c) => {
  const userId = c.get('userId') as string
  const service = getSprintService()
  const sprintId = c.req.param('id')
  const todoId = c.req.param('todoId')

  const sprint = await service.removeTodoFromSprint(userId, sprintId, todoId)
  if (!sprint) {
    return c.json({ error: 'Sprint not found' }, 404)
  }
  return c.json(sprint)
})

export { sprintsRoute }
