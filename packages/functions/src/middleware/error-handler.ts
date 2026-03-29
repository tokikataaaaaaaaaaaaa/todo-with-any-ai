import type { Context } from 'hono'

/**
 * Global error handler for the Hono app.
 * Logs the error and returns a generic 500 response.
 */
export const errorHandler = (err: Error, c: Context) => {
  console.error('Unhandled error:', err.message)
  return c.json({ error: 'Internal Server Error' }, 500)
}
