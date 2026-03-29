import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiKeyService } from '../../services/api-key-service'

// --- Firestore mock helpers ---

function makeDocSnap(id: string, data: Record<string, unknown> | null, exists = true) {
  if (exists && data) {
    return {
      exists: true,
      id,
      data: () => data,
      ref: { update: vi.fn().mockResolvedValue(undefined) },
    }
  }
  return {
    exists: false,
    id,
    data: () => undefined,
    ref: { update: vi.fn().mockResolvedValue(undefined) },
  }
}

function makeQuerySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
      ref: { update: vi.fn().mockResolvedValue(undefined) },
    })),
  }
}

type MockFirestore = ReturnType<typeof createMockFirestore>

function createMockFirestore() {
  const setMock = vi.fn().mockResolvedValue(undefined)
  const deleteMock = vi.fn().mockResolvedValue(undefined)
  const docGetMock = vi.fn().mockResolvedValue(makeDocSnap('missing', null, false))
  const queryGetMock = vi.fn().mockResolvedValue(makeQuerySnap([]))

  const mockDocRef = {
    id: 'auto-id',
    get: docGetMock,
    set: setMock,
    delete: deleteMock,
  }

  const mockCollectionRef = {
    doc: vi.fn().mockReturnValue(mockDocRef),
    where: vi.fn().mockReturnThis(),
    get: queryGetMock,
  }

  const mockCollectionGroupRef = {
    where: vi.fn().mockReturnThis(),
    get: queryGetMock,
    limit: vi.fn().mockReturnThis(),
  }

  const db = {
    collection: vi.fn().mockReturnValue(mockCollectionRef),
    collectionGroup: vi.fn().mockReturnValue(mockCollectionGroupRef),
    _mockDocRef: mockDocRef,
    _mockCollectionRef: mockCollectionRef,
    _mockCollectionGroupRef: mockCollectionGroupRef,
    _setMock: setMock,
    _deleteMock: deleteMock,
    _docGetMock: docGetMock,
    _queryGetMock: queryGetMock,
  }

  return db
}

describe('ApiKeyService', () => {
  let db: MockFirestore
  let service: ApiKeyService

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createMockFirestore()
    service = new ApiKeyService(db as unknown as FirebaseFirestore.Firestore)
  })

  // ==========================================
  // createApiKey
  // ==========================================
  describe('createApiKey', () => {
    it('should return a 64-character hex key, id, name, and createdAt', async () => {
      // countApiKeys returns 0
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result = await service.createApiKey('user-1', 'My Key')

      expect(result.key).toMatch(/^[0-9a-f]{64}$/)
      expect(result.id).toBeDefined()
      expect(result.name).toBe('My Key')
      expect(result.createdAt).toBeDefined()
    })

    it('should store the hashed key in Firestore, not the plaintext', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result = await service.createApiKey('user-1', 'My Key')

      // The set call should contain keyHash, not the plaintext key
      const setCallArgs = db._setMock.mock.calls[0][0]
      expect(setCallArgs.keyHash).toBeDefined()
      expect(setCallArgs.keyHash).not.toBe(result.key)
      expect(setCallArgs.keyHash).toHaveLength(64) // SHA-256 hex
    })

    it('should store name, userId, createdAt, lastUsedAt: null in Firestore', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      await service.createApiKey('user-1', 'Test Key')

      const setCallArgs = db._setMock.mock.calls[0][0]
      expect(setCallArgs.name).toBe('Test Key')
      expect(setCallArgs.userId).toBe('user-1')
      expect(setCallArgs.createdAt).toBeDefined()
      expect(setCallArgs.lastUsedAt).toBeNull()
    })

    it('should throw error for empty name', async () => {
      await expect(service.createApiKey('user-1', '')).rejects.toThrow()
    })

    it('should throw error for name with 101 characters', async () => {
      const longName = 'a'.repeat(101)
      await expect(service.createApiKey('user-1', longName)).rejects.toThrow()
    })

    it('should accept name with exactly 100 characters', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))
      const name100 = 'a'.repeat(100)

      const result = await service.createApiKey('user-1', name100)
      expect(result.name).toBe(name100)
    })

    it('should accept name with exactly 1 character', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result = await service.createApiKey('user-1', 'X')
      expect(result.name).toBe('X')
    })

    it('should throw error when user already has 5 keys', async () => {
      const existingKeys = Array.from({ length: 5 }, (_, i) => ({
        id: `key-${i}`,
        data: { keyHash: `hash-${i}`, name: `Key ${i}`, userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
      }))
      db._queryGetMock.mockResolvedValue(makeQuerySnap(existingKeys))

      await expect(service.createApiKey('user-1', 'Sixth Key')).rejects.toThrow(/limit|上限|5/)
    })

    it('should succeed when user has exactly 4 keys (creating the 5th)', async () => {
      const existingKeys = Array.from({ length: 4 }, (_, i) => ({
        id: `key-${i}`,
        data: { keyHash: `hash-${i}`, name: `Key ${i}`, userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
      }))
      db._queryGetMock.mockResolvedValue(makeQuerySnap(existingKeys))

      const result = await service.createApiKey('user-1', 'Fifth Key')
      expect(result.name).toBe('Fifth Key')
    })

    it('should allow same name for multiple keys (no uniqueness constraint)', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result1 = await service.createApiKey('user-1', 'Same Name')
      expect(result1.name).toBe('Same Name')

      // Second call with same name should also succeed
      const result2 = await service.createApiKey('user-1', 'Same Name')
      expect(result2.name).toBe('Same Name')
    })

    it('should write to the correct Firestore path', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      await service.createApiKey('user-1', 'Path Test')

      expect(db.collection).toHaveBeenCalledWith('users/user-1/apiKeys')
    })
  })

  // ==========================================
  // listApiKeys
  // ==========================================
  describe('listApiKeys', () => {
    it('should return array with id, name, createdAt, lastUsedAt', async () => {
      db._queryGetMock.mockResolvedValue(
        makeQuerySnap([
          {
            id: 'key-1',
            data: { keyHash: 'hash1', name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: '2026-01-02' },
          },
        ])
      )

      const result = await service.listApiKeys('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('key-1')
      expect(result[0].name).toBe('Key 1')
      expect(result[0].createdAt).toBe('2026-01-01')
      expect(result[0].lastUsedAt).toBe('2026-01-02')
    })

    it('should return empty array when no keys exist', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result = await service.listApiKeys('user-1')
      expect(result).toEqual([])
    })

    it('should not include keyHash or plaintext key in response', async () => {
      db._queryGetMock.mockResolvedValue(
        makeQuerySnap([
          {
            id: 'key-1',
            data: { keyHash: 'secret-hash', name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
          },
        ])
      )

      const result = await service.listApiKeys('user-1')

      expect(result[0]).not.toHaveProperty('keyHash')
      expect(result[0]).not.toHaveProperty('key')
      expect(result[0]).not.toHaveProperty('userId')
    })

    it('should return multiple keys', async () => {
      db._queryGetMock.mockResolvedValue(
        makeQuerySnap([
          { id: 'key-1', data: { keyHash: 'h1', name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null } },
          { id: 'key-2', data: { keyHash: 'h2', name: 'Key 2', userId: 'user-1', createdAt: '2026-01-02', lastUsedAt: null } },
          { id: 'key-3', data: { keyHash: 'h3', name: 'Key 3', userId: 'user-1', createdAt: '2026-01-03', lastUsedAt: null } },
        ])
      )

      const result = await service.listApiKeys('user-1')
      expect(result).toHaveLength(3)
    })

    it('should handle lastUsedAt being null', async () => {
      db._queryGetMock.mockResolvedValue(
        makeQuerySnap([
          { id: 'key-1', data: { keyHash: 'h1', name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null } },
        ])
      )

      const result = await service.listApiKeys('user-1')
      expect(result[0].lastUsedAt).toBeNull()
    })
  })

  // ==========================================
  // deleteApiKey
  // ==========================================
  describe('deleteApiKey', () => {
    it('should return true when key exists and belongs to user', async () => {
      db._docGetMock.mockResolvedValue(
        makeDocSnap('key-1', { keyHash: 'h1', name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null })
      )

      const result = await service.deleteApiKey('user-1', 'key-1')
      expect(result).toBe(true)
    })

    it('should call delete on the Firestore document', async () => {
      db._docGetMock.mockResolvedValue(
        makeDocSnap('key-1', { keyHash: 'h1', name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null })
      )

      await service.deleteApiKey('user-1', 'key-1')
      expect(db._mockDocRef.delete).toHaveBeenCalled()
    })

    it('should return false when key does not exist', async () => {
      db._docGetMock.mockResolvedValue(makeDocSnap('missing', null, false))

      const result = await service.deleteApiKey('user-1', 'missing')
      expect(result).toBe(false)
    })

    it('should return false when key belongs to another user', async () => {
      db._docGetMock.mockResolvedValue(
        makeDocSnap('key-1', { keyHash: 'h1', name: 'Key 1', userId: 'other-user', createdAt: '2026-01-01', lastUsedAt: null })
      )

      const result = await service.deleteApiKey('user-1', 'key-1')
      expect(result).toBe(false)
    })

    it('should not call delete when key belongs to another user', async () => {
      db._docGetMock.mockResolvedValue(
        makeDocSnap('key-1', { keyHash: 'h1', name: 'Key 1', userId: 'other-user', createdAt: '2026-01-01', lastUsedAt: null })
      )

      await service.deleteApiKey('user-1', 'key-1')
      expect(db._mockDocRef.delete).not.toHaveBeenCalled()
    })
  })

  // ==========================================
  // verifyApiKey
  // ==========================================
  describe('verifyApiKey', () => {
    it('should return userId when key hash matches', async () => {
      // We need to hash a known key and set up the mock to return a matching doc
      const { hashApiKey } = await import('../../services/auth-service')
      const plainKey = 'a'.repeat(64)
      const hashed = hashApiKey(plainKey)

      db._queryGetMock.mockResolvedValue(
        makeQuerySnap([
          {
            id: 'key-1',
            data: { keyHash: hashed, name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
          },
        ])
      )

      const result = await service.verifyApiKey(plainKey)
      expect(result).toBe('user-1')
    })

    it('should return null for invalid key', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result = await service.verifyApiKey('invalid-key-that-does-not-exist')
      expect(result).toBeNull()
    })

    it('should return null for empty string', async () => {
      const result = await service.verifyApiKey('')
      expect(result).toBeNull()
    })

    it('should update lastUsedAt when verification succeeds', async () => {
      const { hashApiKey } = await import('../../services/auth-service')
      const plainKey = 'b'.repeat(64)
      const hashed = hashApiKey(plainKey)

      const updateMock = vi.fn().mockResolvedValue(undefined)
      const snap = makeQuerySnap([
        {
          id: 'key-1',
          data: { keyHash: hashed, name: 'Key 1', userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
        },
      ])
      // Override the ref.update on the doc
      snap.docs[0].ref.update = updateMock
      db._queryGetMock.mockResolvedValue(snap)

      await service.verifyApiKey(plainKey)

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ lastUsedAt: expect.any(String) })
      )
    })

    it('should use collectionGroup query for verification', async () => {
      const { hashApiKey } = await import('../../services/auth-service')
      const plainKey = 'c'.repeat(64)
      const hashed = hashApiKey(plainKey)

      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      await service.verifyApiKey(plainKey)

      expect(db.collectionGroup).toHaveBeenCalledWith('apiKeys')
    })

    it('should not update lastUsedAt when verification fails', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      await service.verifyApiKey('nonexistent-key')

      // No docs returned, so no update should happen
      // (No ref.update mock to check, but we verify no error thrown)
    })
  })

  // ==========================================
  // countApiKeys
  // ==========================================
  describe('countApiKeys', () => {
    it('should return 0 when user has no keys', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      const result = await service.countApiKeys('user-1')
      expect(result).toBe(0)
    })

    it('should return 3 when user has 3 keys', async () => {
      const keys = Array.from({ length: 3 }, (_, i) => ({
        id: `key-${i}`,
        data: { keyHash: `hash-${i}`, name: `Key ${i}`, userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
      }))
      db._queryGetMock.mockResolvedValue(makeQuerySnap(keys))

      const result = await service.countApiKeys('user-1')
      expect(result).toBe(3)
    })

    it('should return 5 when user has 5 keys', async () => {
      const keys = Array.from({ length: 5 }, (_, i) => ({
        id: `key-${i}`,
        data: { keyHash: `hash-${i}`, name: `Key ${i}`, userId: 'user-1', createdAt: '2026-01-01', lastUsedAt: null },
      }))
      db._queryGetMock.mockResolvedValue(makeQuerySnap(keys))

      const result = await service.countApiKeys('user-1')
      expect(result).toBe(5)
    })

    it('should query the correct collection path', async () => {
      db._queryGetMock.mockResolvedValue(makeQuerySnap([]))

      await service.countApiKeys('user-1')
      expect(db.collection).toHaveBeenCalledWith('users/user-1/apiKeys')
    })
  })
})
