import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler'
import { authMiddleware } from './middleware/firebase-auth'
import { rateLimiter } from './middleware/rate-limiter'
import { todosRoute, setTodoService } from './routes/todos'
import { authRoute, setApiKeyService } from './routes/auth'
import { TodoService } from './services/todo-service'
import { ApiKeyService } from './services/api-key-service'
import { db } from './lib/firebase'

// Initialize service instances with Firestore
setTodoService(new TodoService(db))
setApiKeyService(new ApiKeyService(db))

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

// Also protect the exact paths (without trailing slash/wildcard)
app.use('/todos', authMiddleware)
app.use('/todos', rateLimiter())
app.use('/keys', authMiddleware)
app.use('/keys', rateLimiter())

// Routes
app.route('/todos', todosRoute)
app.route('/keys', authRoute)

export { app }
