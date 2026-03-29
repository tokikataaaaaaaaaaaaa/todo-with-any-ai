import { onRequest } from 'firebase-functions/v2/https'
import { app } from './app'
import type { HttpsFunction } from 'firebase-functions/v2/https'

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
