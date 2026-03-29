import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { errorHandler } from '../../middleware/error-handler'

describe('error-handler', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(errorHandler)
  })

  it('should return 500 status code when an error is thrown', async () => {
    app.get('/error', () => {
      throw new Error('Something went wrong')
    })

    const res = await app.request('/error')
    expect(res.status).toBe(500)
  })

  it('should return JSON body with error message', async () => {
    app.get('/error', () => {
      throw new Error('Something went wrong')
    })

    const res = await app.request('/error')
    const body = await res.json()
    expect(body).toEqual({ error: 'Internal Server Error' })
  })

  it('should call console.error with the error message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    app.get('/error', () => {
      throw new Error('Test error message')
    })

    await app.request('/error')
    expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', 'Test error message')

    consoleSpy.mockRestore()
  })

  it('should handle errors without a message', async () => {
    app.get('/error', () => {
      throw new Error()
    })

    const res = await app.request('/error')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Internal Server Error' })
  })

  it('should not leak error details to the client', async () => {
    app.get('/error', () => {
      throw new Error('Sensitive database connection string: postgres://...')
    })

    const res = await app.request('/error')
    const body = await res.json()
    expect(body.error).not.toContain('postgres')
    expect(body.error).toBe('Internal Server Error')
  })

  it('should return application/json content type', async () => {
    app.get('/error', () => {
      throw new Error('test')
    })

    const res = await app.request('/error')
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})
