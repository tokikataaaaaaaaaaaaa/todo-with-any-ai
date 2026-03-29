import { createMiddleware } from 'hono/factory'
import type { MiddlewareHandler } from 'hono'

// ---------------------------------------------------------------------------
// RateLimitStore interface - swap implementations for Firestore/Redis later
// ---------------------------------------------------------------------------
export interface RateLimitStore {
  check(key: string): { allowed: boolean; remaining: number; resetAt: number }
  increment(key: string): void
  reset(key: string): void
}

// ---------------------------------------------------------------------------
// InMemoryRateLimitStore - suitable for single Cloud Functions instance MVP
// ---------------------------------------------------------------------------
interface BucketEntry {
  count: number
  windowStart: number
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly maxRequests: number
  private readonly windowMs: number
  private readonly buckets = new Map<string, BucketEntry>()

  constructor(options: { maxRequests: number; windowMs: number }) {
    this.maxRequests = options.maxRequests
    this.windowMs = options.windowMs
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.buckets.get(key)

    // No entry or window expired -> fresh state
    if (!entry || now - entry.windowStart >= this.windowMs) {
      if (entry && now - entry.windowStart >= this.windowMs) {
        this.buckets.delete(key)
      }
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetAt: now + this.windowMs,
      }
    }

    const remaining = Math.max(0, this.maxRequests - entry.count)
    return {
      allowed: remaining > 0,
      remaining,
      resetAt: entry.windowStart + this.windowMs,
    }
  }

  increment(key: string): void {
    const now = Date.now()
    const entry = this.buckets.get(key)

    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now })
      return
    }

    entry.count += 1
  }

  reset(key: string): void {
    this.buckets.delete(key)
  }
}

// ---------------------------------------------------------------------------
// Hono middleware factory
// ---------------------------------------------------------------------------
interface RateLimiterOptions {
  maxRequests?: number
  windowMs?: number
  store?: RateLimitStore
}

export function rateLimiter(options?: RateLimiterOptions): MiddlewareHandler {
  const maxRequests = options?.maxRequests ?? 100
  const windowMs = options?.windowMs ?? 60_000
  const store: RateLimitStore =
    options?.store ?? new InMemoryRateLimitStore({ maxRequests, windowMs })

  return createMiddleware(async (c, next) => {
    // Use userId set by auth middleware; skip if unauthenticated
    const userId = c.get('userId' as never) as string | undefined
    if (!userId) {
      await next()
      return
    }

    const { allowed, remaining, resetAt } = store.check(userId)
    const resetAtSeconds = Math.ceil(resetAt / 1000)

    if (!allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
      c.header('X-RateLimit-Limit', String(maxRequests))
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', String(resetAtSeconds))
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }

    // Allowed - increment and proceed
    store.increment(userId)
    const newRemaining = Math.max(0, remaining - 1)

    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(newRemaining))
    c.header('X-RateLimit-Reset', String(resetAtSeconds))

    await next()
  })
}
