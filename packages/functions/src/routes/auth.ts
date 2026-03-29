import { Hono } from 'hono'
import { createApiKeySchema } from '@todo-with-any-ai/shared'
import { ApiKeyService } from '../services/api-key-service'

type Env = {
  Variables: {
    userId: string
  }
}

// ApiKeyService instance will be injected via setter
let apiKeyServiceInstance: ApiKeyService | null = null

export function setApiKeyService(service: ApiKeyService) {
  apiKeyServiceInstance = service
}

export function getApiKeyService(): ApiKeyService {
  if (!apiKeyServiceInstance) {
    throw new Error('ApiKeyService not initialized. Call setApiKeyService() first.')
  }
  return apiKeyServiceInstance
}

const authRoute = new Hono<Env>()

// POST /api/keys - Create API key
authRoute.post('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getApiKeyService()

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Validate with zod schema
  const parsed = createApiKeySchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  try {
    const result = await service.createApiKey(userId, parsed.data.name)
    return c.json(result, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('limit')) {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// GET /api/keys - List API keys
authRoute.get('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getApiKeyService()

  const keys = await service.listApiKeys(userId)
  return c.json(keys)
})

// DELETE /api/keys/:id - Delete API key
authRoute.delete('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getApiKeyService()
  const keyId = c.req.param('id')

  const deleted = await service.deleteApiKey(userId, keyId)
  if (!deleted) {
    return c.json({ error: 'API key not found' }, 404)
  }
  return c.body(null, 204)
})

export { authRoute }
