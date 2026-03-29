import { Hono } from 'hono'
import { createUrgencyLevelSchema, updateUrgencyLevelSchema } from '@todo-with-any-ai/shared'
import { UrgencyLevelService } from '../services/urgency-level-service'

type Env = {
  Variables: {
    userId: string
  }
}

let urgencyLevelServiceInstance: UrgencyLevelService | null = null

export function setUrgencyLevelService(service: UrgencyLevelService) {
  urgencyLevelServiceInstance = service
}

export function getUrgencyLevelService(): UrgencyLevelService {
  if (!urgencyLevelServiceInstance) {
    throw new Error('UrgencyLevelService not initialized. Call setUrgencyLevelService() first.')
  }
  return urgencyLevelServiceInstance
}

const urgencyLevelsRoute = new Hono<Env>()

// GET /api/urgency-levels - List levels (auto-create defaults on first call)
urgencyLevelsRoute.get('/', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const service = getUrgencyLevelService()
  const levels = await service.listUrgencyLevels(userId)
  return c.json(levels)
})

// POST /api/urgency-levels - Create custom level
urgencyLevelsRoute.post('/', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const service = getUrgencyLevelService()

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const parsed = createUrgencyLevelSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  try {
    const level = await service.createUrgencyLevel(userId, parsed.data)
    return c.json(level, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 400)
  }
})

// PATCH /api/urgency-levels/:id - Update level
urgencyLevelsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const service = getUrgencyLevelService()
  const levelId = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const parsed = updateUrgencyLevelSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  const level = await service.updateUrgencyLevel(userId, levelId, parsed.data)
  if (!level) {
    return c.json({ error: 'Urgency level not found' }, 404)
  }
  return c.json(level)
})

// DELETE /api/urgency-levels/:id - Delete level (default levels cannot be deleted)
urgencyLevelsRoute.delete('/:id', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const service = getUrgencyLevelService()
  const levelId = c.req.param('id')

  try {
    const result = await service.deleteUrgencyLevel(userId, levelId)
    if (result === null) {
      return c.json({ error: 'Urgency level not found' }, 404)
    }
    return c.body(null, 204)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('default')) {
      return c.json({ error: message }, 403)
    }
    return c.json({ error: message }, 400)
  }
})

export { urgencyLevelsRoute }
