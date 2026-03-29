import { onRequest } from 'firebase-functions/v2/https'
import { app } from './app'
import { setTodoService } from './routes/todos'
import { setApiKeyService } from './routes/auth'
import { setProjectService } from './routes/projects'
import { setUrgencyLevelService } from './routes/urgency-levels'
import { TodoService } from './services/todo-service'
import { ApiKeyService } from './services/api-key-service'
import { ProjectService } from './services/project-service'
import { UrgencyLevelService } from './services/urgency-level-service'
import { db } from './lib/firebase'
import type { HttpsFunction } from 'firebase-functions/v2/https'

// Initialize service instances with Firestore (only in production, not during tests)
setTodoService(new TodoService(db))
setApiKeyService(new ApiKeyService(db))
setProjectService(new ProjectService(db))
setUrgencyLevelService(new UrgencyLevelService(db))

export const api: HttpsFunction = onRequest({ invoker: 'public' }, async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    }
  }

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const response = await app.fetch(request)

  res.status(response.status)
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  const responseBody = await response.text()
  res.send(responseBody)
})
