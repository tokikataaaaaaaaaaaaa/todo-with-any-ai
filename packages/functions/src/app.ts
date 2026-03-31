import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler'
import { authMiddleware } from './middleware/firebase-auth'
import { rateLimiter } from './middleware/rate-limiter'
import { todosRoute } from './routes/todos'
import { authRoute } from './routes/auth'
import { projectsRoute } from './routes/projects'
import { sprintsRoute } from './routes/sprints'

const app = new Hono().basePath('/api')

// CORS
app.use('*', cors())

// Error handler
app.onError(errorHandler)

// Health check (no auth, no rate limiting)
app.get('/health', (c) => c.json({ status: 'ok' }))

// Auth & rate limiting for protected routes
app.use('/todos/*', authMiddleware)
app.use('/todos/*', rateLimiter())
app.use('/keys/*', authMiddleware)
app.use('/keys/*', rateLimiter())
app.use('/projects/*', authMiddleware)
app.use('/projects/*', rateLimiter())
app.use('/sprints/*', authMiddleware)
app.use('/sprints/*', rateLimiter())

// Also protect the exact paths (without trailing slash/wildcard)
app.use('/todos', authMiddleware)
app.use('/todos', rateLimiter())
app.use('/keys', authMiddleware)
app.use('/keys', rateLimiter())
app.use('/projects', authMiddleware)
app.use('/projects', rateLimiter())
app.use('/sprints', authMiddleware)
app.use('/sprints', rateLimiter())

// Routes
app.route('/todos', todosRoute)
app.route('/keys', authRoute)
app.route('/projects', projectsRoute)
app.route('/sprints', sprintsRoute)

export { app }
