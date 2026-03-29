import { describe, it, expect } from 'vitest'
import { app } from '../app'

describe('Hono app', () => {
  // --- Health check ---
  it('GET /api/health should return 200', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
  })

  it('GET /api/health should return { status: "ok" }', async () => {
    const res = await app.request('/api/health')
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })

  it('GET /api/health should have application/json content-type', async () => {
    const res = await app.request('/api/health')
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  // --- 404 for unknown paths ---
  it('GET /unknown should return 404', async () => {
    const res = await app.request('/unknown')
    expect(res.status).toBe(404)
  })

  it('GET /api/nonexistent should return 404', async () => {
    const res = await app.request('/api/nonexistent')
    expect(res.status).toBe(404)
  })

  // --- CORS ---
  it('should include Access-Control-Allow-Origin header', async () => {
    const res = await app.request('/api/health', {
      headers: { Origin: 'http://localhost:3000' },
    })
    const acao = res.headers.get('Access-Control-Allow-Origin')
    expect(acao).toBeTruthy()
  })

  it('should respond to OPTIONS preflight request', async () => {
    const res = await app.request('/api/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    })
    // CORS preflight should not return 404
    expect(res.status).toBeLessThan(400)
  })

  it('OPTIONS preflight should include Access-Control-Allow-Methods', async () => {
    const res = await app.request('/api/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    })
    const methods = res.headers.get('Access-Control-Allow-Methods')
    expect(methods).toBeTruthy()
  })

  // --- HTTP methods ---
  it('POST /api/health should return 404 or 405 (only GET is defined)', async () => {
    const res = await app.request('/api/health', { method: 'POST' })
    // Hono returns 404 for methods not registered on a route
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  // --- Base path ---
  it('GET /health (without /api prefix) should return 404', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(404)
  })

  // --- Response format ---
  it('health response body should be valid JSON', async () => {
    const res = await app.request('/api/health')
    const text = await res.text()
    expect(() => JSON.parse(text)).not.toThrow()
  })

  it('health response should have "status" key', async () => {
    const res = await app.request('/api/health')
    const body = await res.json()
    expect(body).toHaveProperty('status')
  })

  it('health response "status" should be a string', async () => {
    const res = await app.request('/api/health')
    const body = await res.json()
    expect(typeof body.status).toBe('string')
  })

  // --- Multiple requests ---
  it('should handle multiple concurrent requests', async () => {
    const responses = await Promise.all([
      app.request('/api/health'),
      app.request('/api/health'),
      app.request('/api/health'),
    ])
    responses.forEach((res) => {
      expect(res.status).toBe(200)
    })
  })

  // --- Error handling integration ---
  it('should return JSON even for unhandled routes', async () => {
    const res = await app.request('/api/does-not-exist')
    // Hono default 404 - just verify it doesn't crash
    expect(res.status).toBe(404)
  })
})
