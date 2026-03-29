import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import {
  InMemoryRateLimitStore,
  rateLimiter,
  type RateLimitStore,
} from '../../middleware/rate-limiter'

// ---------------------------------------------------------------------------
// InMemoryRateLimitStore unit tests
// ---------------------------------------------------------------------------
describe('InMemoryRateLimitStore', () => {
  let store: InMemoryRateLimitStore

  beforeEach(() => {
    store = new InMemoryRateLimitStore({ maxRequests: 100, windowMs: 60_000 })
  })

  it('should return allowed: true and remaining: 99 on first check after increment', () => {
    store.increment('user-1')
    const result = store.check('user-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99)
  })

  it('should return allowed: true and remaining: 100 on check without any increment', () => {
    const result = store.check('user-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)
  })

  it('should return allowed: false and remaining: 0 after 100 increments', () => {
    for (let i = 0; i < 100; i++) {
      store.increment('user-1')
    }
    const result = store.check('user-1')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should return allowed: true and remaining: 100 after reset', () => {
    for (let i = 0; i < 100; i++) {
      store.increment('user-1')
    }
    store.reset('user-1')
    const result = store.check('user-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)
  })

  it('should track different keys independently', () => {
    for (let i = 0; i < 50; i++) {
      store.increment('user-a')
    }
    store.increment('user-b')
    const resultA = store.check('user-a')
    const resultB = store.check('user-b')
    expect(resultA.remaining).toBe(50)
    expect(resultB.remaining).toBe(99)
  })

  it('should auto-reset after windowMs has elapsed', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    for (let i = 0; i < 100; i++) {
      store.increment('user-1')
    }
    expect(store.check('user-1').allowed).toBe(false)

    // Advance time past the window
    vi.spyOn(Date, 'now').mockReturnValue(now + 60_001)
    const result = store.check('user-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)

    vi.restoreAllMocks()
  })

  it('should return a resetAt timestamp in the future', () => {
    store.increment('user-1')
    const result = store.check('user-1')
    expect(result.resetAt).toBeGreaterThan(Date.now() - 1000)
  })

  it('should not go below 0 remaining even with extra increments', () => {
    for (let i = 0; i < 150; i++) {
      store.increment('user-1')
    }
    const result = store.check('user-1')
    expect(result.remaining).toBe(0)
    expect(result.allowed).toBe(false)
  })

  it('should work with custom maxRequests', () => {
    const customStore = new InMemoryRateLimitStore({ maxRequests: 5, windowMs: 60_000 })
    for (let i = 0; i < 5; i++) {
      customStore.increment('user-1')
    }
    expect(customStore.check('user-1').allowed).toBe(false)
    expect(customStore.check('user-1').remaining).toBe(0)
  })

  it('should work with custom windowMs', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const customStore = new InMemoryRateLimitStore({ maxRequests: 100, windowMs: 1000 })
    for (let i = 0; i < 100; i++) {
      customStore.increment('user-1')
    }
    expect(customStore.check('user-1').allowed).toBe(false)

    // Advance past 1 second window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1001)
    expect(customStore.check('user-1').allowed).toBe(true)

    vi.restoreAllMocks()
  })
})

// ---------------------------------------------------------------------------
// rateLimiter middleware integration tests
// ---------------------------------------------------------------------------
describe('rateLimiter middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function setupApp(options?: Parameters<typeof rateLimiter>[0]) {
    app = new Hono<{ Variables: { userId: string } }>()
    // Simulate auth middleware setting userId
    app.use('/*', async (c, next) => {
      const userId = c.req.header('X-Test-UserId')
      if (userId) {
        c.set('userId', userId)
      }
      await next()
    })
    app.use('/*', rateLimiter(options))
    app.get('/test', (c) => c.json({ ok: true }))
  }

  it('should return 200 with rate limit headers on normal request', async () => {
    setupApp()
    const res = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100')
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined()
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('should return 429 after exceeding maxRequests', async () => {
    setupApp({ maxRequests: 5 })
    for (let i = 0; i < 5; i++) {
      await app.request('/test', {
        headers: { 'X-Test-UserId': 'user-1' },
      })
    }
    const res = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('Rate limit exceeded')
  })

  it('should set X-RateLimit-Limit header to 100 by default', async () => {
    setupApp()
    const res = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100')
  })

  it('should decrement X-RateLimit-Remaining with each request', async () => {
    setupApp({ maxRequests: 10 })

    const res1 = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res1.headers.get('X-RateLimit-Remaining')).toBe('9')

    const res2 = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res2.headers.get('X-RateLimit-Remaining')).toBe('8')

    const res3 = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res3.headers.get('X-RateLimit-Remaining')).toBe('7')
  })

  it('should set X-RateLimit-Reset to a Unix timestamp', async () => {
    setupApp()
    const res = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    const resetHeader = res.headers.get('X-RateLimit-Reset')
    expect(resetHeader).toBeDefined()
    const resetTimestamp = Number(resetHeader)
    expect(resetTimestamp).toBeGreaterThan(0)
    // Should be a Unix timestamp in seconds (within reason)
    expect(resetTimestamp).toBeLessThan(Date.now() / 1000 + 120)
  })

  it('should work with custom maxRequests=5', async () => {
    setupApp({ maxRequests: 5 })
    const res = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4')
  })

  it('should work with custom windowMs=1000', async () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    setupApp({ maxRequests: 2, windowMs: 1000 })

    // Exhaust limit
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    const blocked = await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    expect(blocked.status).toBe(429)

    // Advance time past window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1001)
    const allowed = await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    expect(allowed.status).toBe(200)
  })

  it('should skip rate limiting when userId is not set (unauthenticated)', async () => {
    setupApp({ maxRequests: 1 })
    // No X-Test-UserId header -> no userId set
    const res1 = await app.request('/test')
    expect(res1.status).toBe(200)
    const res2 = await app.request('/test')
    expect(res2.status).toBe(200)
    // Should not have rate limit headers
    expect(res1.headers.get('X-RateLimit-Limit')).toBeNull()
  })

  it('should track different userIds independently', async () => {
    setupApp({ maxRequests: 2 })

    // User A uses 2 requests
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-a' } })
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-a' } })
    const blockedA = await app.request('/test', { headers: { 'X-Test-UserId': 'user-a' } })
    expect(blockedA.status).toBe(429)

    // User B should still be allowed
    const allowedB = await app.request('/test', { headers: { 'X-Test-UserId': 'user-b' } })
    expect(allowedB.status).toBe(200)
  })

  it('should include rate limit headers on 429 responses', async () => {
    setupApp({ maxRequests: 1 })
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    const res = await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    expect(res.status).toBe(429)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('1')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('should accept a custom RateLimitStore', async () => {
    const mockStore: RateLimitStore = {
      check: vi.fn().mockReturnValue({ allowed: true, remaining: 43, resetAt: Date.now() + 60000 }),
      increment: vi.fn(),
      reset: vi.fn(),
    }
    setupApp({ store: mockStore })

    const res = await app.request('/test', {
      headers: { 'X-Test-UserId': 'user-1' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('42')
    expect(mockStore.check).toHaveBeenCalledWith('user-1')
    expect(mockStore.increment).toHaveBeenCalledWith('user-1')
  })

  it('should return Retry-After header on 429 responses', async () => {
    setupApp({ maxRequests: 1 })
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    const res = await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    expect(res.status).toBe(429)
    const retryAfter = res.headers.get('Retry-After')
    expect(retryAfter).toBeDefined()
    expect(Number(retryAfter)).toBeGreaterThan(0)
  })

  it('should not increment when request is already blocked', async () => {
    const mockStore: RateLimitStore = {
      check: vi.fn().mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 }),
      increment: vi.fn(),
      reset: vi.fn(),
    }
    setupApp({ store: mockStore })

    await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    expect(mockStore.increment).not.toHaveBeenCalled()
  })

  it('should set X-RateLimit-Remaining to 0 on 429 (not negative)', async () => {
    setupApp({ maxRequests: 1 })
    await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    // Multiple blocked requests
    const res1 = await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    const res2 = await app.request('/test', { headers: { 'X-Test-UserId': 'user-1' } })
    expect(res1.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(res2.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
