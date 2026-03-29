import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'

// Mock firebase-admin before importing the middleware
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}))

vi.mock('../../lib/firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
  },
}))

import { authMiddleware } from '../../middleware/firebase-auth'
import { getAuth } from 'firebase-admin/auth'
import { db } from '../../lib/firebase'

describe('firebase-auth middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.use('/*', authMiddleware)
    app.get('/protected', (c) => {
      const userId = c.get('userId')
      return c.json({ userId })
    })
    vi.clearAllMocks()
  })

  // --- Missing Authorization header ---
  it('should return 401 when Authorization header is missing', async () => {
    const res = await app.request('/protected')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  // --- No "Bearer " prefix ---
  it('should return 401 when Authorization header does not start with "Bearer "', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Token abc123' },
    })
    expect(res.status).toBe(401)
  })

  // --- Empty token ---
  it('should return 401 when token is empty', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: '' },
    })
    expect(res.status).toBe(401)
  })

  // --- "Bearer " with empty string after it ---
  it('should return 401 when Bearer token is empty string', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer ' },
    })
    expect(res.status).toBe(401)
  })

  // --- Basic auth scheme ---
  it('should return 401 when using Basic auth scheme', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    })
    expect(res.status).toBe(401)
  })

  // --- lowercase "bearer" ---
  it('should return 401 for lowercase "bearer" prefix', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'bearer some-token' },
    })
    expect(res.status).toBe(401)
  })

  // --- Valid JWT token (Firebase ID Token) ---
  it('should set userId and call next for a valid JWT token', async () => {
    const mockVerifyIdToken = vi.fn().mockResolvedValue({ uid: 'user-123' })
    vi.mocked(getAuth).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as any)

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer header.payload.signature' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe('user-123')
    expect(mockVerifyIdToken).toHaveBeenCalledWith('header.payload.signature')
  })

  // --- Invalid JWT token (Firebase verification fails) ---
  it('should return 401 when Firebase verification fails for JWT', async () => {
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Invalid token'))
    vi.mocked(getAuth).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as any)

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  // --- Valid API key ---
  it('should set userId and call next for a valid API key', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [
        {
          data: () => ({
            userId: 'apikey-user-456',
            name: 'test-key',
          }),
        },
      ],
    })
    const mockLimit = vi.fn(() => ({ get: mockGet }))
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    vi.mocked(db.collection).mockReturnValue({ where: mockWhere } as any)

    const apiKey = 'a'.repeat(64)
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe('apikey-user-456')
  })

  // --- Invalid API key (not found in Firestore) ---
  it('should return 401 for an invalid API key', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] })
    const mockLimit = vi.fn(() => ({ get: mockGet }))
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    vi.mocked(db.collection).mockReturnValue({ where: mockWhere } as any)

    const apiKey = 'b'.repeat(64)
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  // --- Token with whitespace ---
  it('should handle token with trailing whitespace', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer   ' },
    })
    expect(res.status).toBe(401)
  })

  // --- Multiple Authorization headers behavior (first header used) ---
  it('should return 401 for just "Bearer" with no token', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer' },
    })
    expect(res.status).toBe(401)
  })

  // --- API key hash lookup uses correct collection ---
  it('should query Firestore api_keys collection for API key', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] })
    const mockLimit = vi.fn(() => ({ get: mockGet }))
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    vi.mocked(db.collection).mockReturnValue({ where: mockWhere } as any)

    const apiKey = 'c'.repeat(64)
    await app.request('/protected', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    expect(db.collection).toHaveBeenCalledWith('api_keys')
  })

  // --- API key hash is passed to Firestore query ---
  it('should hash the API key before querying Firestore', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] })
    const mockLimit = vi.fn(() => ({ get: mockGet }))
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    vi.mocked(db.collection).mockReturnValue({ where: mockWhere } as any)

    const apiKey = 'd'.repeat(64)
    await app.request('/protected', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    // Should query with 'hashedKey' field and the SHA-256 hash of the key
    expect(mockWhere).toHaveBeenCalledWith('hashedKey', '==', expect.any(String))
    // Verify the hash is not the raw key
    const calledHash = mockWhere.mock.calls[0][2]
    expect(calledHash).not.toBe(apiKey)
    expect(calledHash).toHaveLength(64)
  })

  // --- Firestore error during API key lookup ---
  it('should return 401 when Firestore query throws an error', async () => {
    const mockGet = vi.fn().mockRejectedValue(new Error('Firestore error'))
    const mockLimit = vi.fn(() => ({ get: mockGet }))
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    vi.mocked(db.collection).mockReturnValue({ where: mockWhere } as any)

    const apiKey = 'e'.repeat(64)
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    expect(res.status).toBe(401)
  })

  // --- Token with dots but empty parts ---
  it('should return 401 for token with dots but empty parts ("..")', async () => {
    // ".." splits into ["", "", ""] - isJWT returns false (empty parts)
    // Falls through to API key path, which also fails
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer ..' },
    })
    expect(res.status).toBe(401)
  })

  // --- Response body structure consistency ---
  it('should always return { error: "Unauthorized" } for auth failures', async () => {
    // No header
    const res1 = await app.request('/protected')
    const body1 = await res1.json()
    expect(body1).toEqual({ error: 'Unauthorized' })

    // Bad scheme
    const res2 = await app.request('/protected', {
      headers: { Authorization: 'Basic abc' },
    })
    const body2 = await res2.json()
    expect(body2).toEqual({ error: 'Unauthorized' })
  })

  // --- Non-hex API key that is not JWT ---
  it('should attempt API key verification for non-JWT non-hex tokens', async () => {
    const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] })
    const mockLimit = vi.fn(() => ({ get: mockGet }))
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    vi.mocked(db.collection).mockReturnValue({ where: mockWhere } as any)

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer some-random-key-without-dots' },
    })
    expect(res.status).toBe(401)
  })

  // --- Very long token ---
  it('should handle very long tokens gracefully', async () => {
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Invalid'))
    vi.mocked(getAuth).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as any)

    const longToken = 'a'.repeat(10000) + '.' + 'b'.repeat(10000) + '.' + 'c'.repeat(10000)
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${longToken}` },
    })
    expect(res.status).toBe(401)
  })
})
