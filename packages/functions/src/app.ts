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

// Routes (placeholder)
// app.route('/todos', todosRoute)
// app.route('/keys', authRoute)

export { app }
