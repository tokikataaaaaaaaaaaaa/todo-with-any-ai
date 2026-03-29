import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler'
import { authMiddleware } from './middleware/firebase-auth'
import { rateLimiter } from './middleware/rate-limiter'
import { todosRoute, setTodoService } from './routes/todos'
import { authRoute, setApiKeyService } from './routes/auth'
import { projectsRoute, setProjectService } from './routes/projects'
import { TodoService } from './services/todo-service'
import { ApiKeyService } from './services/api-key-service'
import { ProjectService } from './services/project-service'
import { urgencyLevelsRoute, setUrgencyLevelService } from './routes/urgency-levels'
import { UrgencyLevelService } from './services/urgency-level-service'
import { db } from './lib/firebase'

// Initialize service instances with Firestore
setTodoService(new TodoService(db))
setApiKeyService(new ApiKeyService(db))
setProjectService(new ProjectService(db))
setUrgencyLevelService(new UrgencyLevelService(db))

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
app.use('/urgency-levels/*', authMiddleware)
app.use('/urgency-levels/*', rateLimiter())

// Also protect the exact paths (without trailing slash/wildcard)
app.use('/todos', authMiddleware)
app.use('/todos', rateLimiter())
app.use('/keys', authMiddleware)
app.use('/keys', rateLimiter())
app.use('/projects', authMiddleware)
app.use('/projects', rateLimiter())
app.use('/urgency-levels', authMiddleware)
app.use('/urgency-levels', rateLimiter())

// Routes
app.route('/todos', todosRoute)
app.route('/keys', authRoute)
app.route('/projects', projectsRoute)
app.route('/urgency-levels', urgencyLevelsRoute)

export { app }
