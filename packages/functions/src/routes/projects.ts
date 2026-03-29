import { Hono } from 'hono'
import { createProjectSchema, updateProjectSchema } from '@todo-with-any-ai/shared'
import { ProjectService } from '../services/project-service'

type Env = {
  Variables: {
    userId: string
  }
}

// ProjectService instance will be injected via the factory or set externally
let projectServiceInstance: ProjectService | null = null

export function setProjectService(service: ProjectService) {
  projectServiceInstance = service
}

export function getProjectService(): ProjectService {
  if (!projectServiceInstance) {
    throw new Error('ProjectService not initialized. Call setProjectService() first.')
  }
  return projectServiceInstance
}

const projectsRoute = new Hono<Env>()

// Guard: ensure userId is set (auth middleware must run before this route)
projectsRoute.use('*', async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})
projectsRoute.use('/', async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// GET /api/projects - List projects
projectsRoute.get('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getProjectService()

  const projects = await service.listProjects(userId)
  return c.json(projects)
})

// POST /api/projects - Create project
projectsRoute.post('/', async (c) => {
  const userId = c.get('userId') as string
  const service = getProjectService()

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Validate with zod schema
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  try {
    const project = await service.createProject(userId, parsed.data)
    return c.json(project, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 400)
  }
})

// PATCH /api/projects/:id - Update project
projectsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getProjectService()
  const projectId = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
  }

  const project = await service.updateProject(userId, projectId, parsed.data)
  if (!project) {
    return c.json({ error: 'Project not found' }, 404)
  }
  return c.json(project)
})

// DELETE /api/projects/:id - Delete project
projectsRoute.delete('/:id', async (c) => {
  const userId = c.get('userId') as string
  const service = getProjectService()
  const projectId = c.req.param('id')

  const deleteTodosParam = c.req.query('deleteTodos')
  const deleteTodos = deleteTodosParam === 'true'

  const count = await service.deleteProject(userId, projectId, deleteTodos)
  if (count === 0) {
    return c.json({ error: 'Project not found' }, 404)
  }
  return c.body(null, 204)
})

export { projectsRoute }
