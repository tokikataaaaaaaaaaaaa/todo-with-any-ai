import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler'

const app = new Hono().basePath('/api')

// CORS
app.use('*', cors())

// Error handler
app.onError(errorHandler)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes
// app.route('/todos', todosRoute)
import { authRoute } from './routes/auth'
app.route('/keys', authRoute)

export { app }
