import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UrgencyLevelService } from '../../services/urgency-level-service'

// --- Types ---

interface UrgencyLevel {
  id: string
  name: string
  color: string
  icon: string
  order: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// --- Firestore mock helpers ---

function makeLevel(overrides: Partial<UrgencyLevel> = {}): UrgencyLevel {
  return {
    id: 'level-1',
    name: '緊急',
    color: '#DC2626',
    icon: '🔴',
    order: 0,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDocSnap(data: UrgencyLevel | null, exists = true) {
  if (exists && data) {
    const { id, ...rest } = data
    return {
      exists: true,
      id: data.id,
      data: () => rest,
    }
  }
  return {
    exists: false,
    id: data?.id ?? 'missing',
    data: () => undefined,
  }
}

function makeQuerySnap(docs: UrgencyLevel[]) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => {
        const { id, ...rest } = d
        return rest
      },
    })),
  }
}

function createMockFirestore() {
  const queryResults: { levels: UrgencyLevel[]; todos: UrgencyLevel[] } = {
    levels: [],
    todos: [],
  }

  const batchOps: Array<{ type: string; ref: unknown; data?: unknown }> = []
  const setOps: Array<{ data: unknown }> = []

  const mockBatch = {
    set: vi.fn((ref, data) => {
      batchOps.push({ type: 'set', ref, data })
    }),
    update: vi.fn((ref, data) => {
      batchOps.push({ type: 'update', ref, data })
    }),
    delete: vi.fn((ref) => {
      batchOps.push({ type: 'delete', ref })
    }),
    commit: vi.fn().mockResolvedValue(undefined),
  }

  const docMocks = new Map<string, ReturnType<typeof vi.fn>>()

  const mockLevelsQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockImplementation(() => Promise.resolve(makeQuerySnap(queryResults.levels))),
  }

  const mockTodosQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockImplementation(() => Promise.resolve(makeQuerySnap(queryResults.todos))),
  }

  const mockDocRef = (id: string) => {
    const getMock = docMocks.get(id) ?? vi.fn().mockResolvedValue(makeDocSnap(null, false))
    return {
      id,
      get: getMock,
      set: vi.fn((data) => {
        setOps.push({ data })
        return Promise.resolve(undefined)
      }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }
  }

  const mockLevelsCollection = {
    doc: vi.fn((id?: string) => mockDocRef(id ?? `auto-${Date.now()}`)),
    where: mockLevelsQuery.where,
    orderBy: mockLevelsQuery.orderBy,
    get: mockLevelsQuery.get,
  }

  const mockTodosCollection = {
    doc: vi.fn((id?: string) => mockDocRef(id ?? `auto-${Date.now()}`)),
    where: mockTodosQuery.where,
    orderBy: mockTodosQuery.orderBy,
    get: mockTodosQuery.get,
  }

  const mockFirestore = {
    collection: vi.fn((path: string) => {
      if (path.includes('urgencyLevels')) {
        return mockLevelsCollection
      }
      if (path.includes('todos')) {
        return mockTodosCollection
      }
      return mockLevelsCollection
    }),
    batch: vi.fn().mockReturnValue(mockBatch),
    _queryResults: queryResults,
    _mockLevelsCollection: mockLevelsCollection,
    _mockTodosCollection: mockTodosCollection,
    _mockLevelsQuery: mockLevelsQuery,
    _mockTodosQuery: mockTodosQuery,
    _mockBatch: mockBatch,
    _batchOps: batchOps,
    _setOps: setOps,
    _docMocks: docMocks,
  }

  return mockFirestore
}

function setLevelsQueryResults(db: any, levels: UrgencyLevel[]) {
  db._queryResults.levels = levels
  db._mockLevelsQuery.get.mockResolvedValue(makeQuerySnap(levels))
}

function setTodosQueryResults(db: any, todos: any[]) {
  db._mockTodosQuery.get.mockResolvedValue(makeQuerySnap(todos))
}

function setDocGetResult(db: any, docId: string, level: UrgencyLevel | null) {
  const snap = level ? makeDocSnap(level, true) : makeDocSnap(null, false)
  const getMock = vi.fn().mockResolvedValue(snap)
  db._docMocks.set(docId, getMock)

  // Override doc method to handle this specific id
  const origLevelsDoc = db._mockLevelsCollection.doc
  db._mockLevelsCollection.doc = vi.fn().mockImplementation((id?: string) => {
    if (id === docId) {
      return {
        id: docId,
        get: getMock,
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      }
    }
    return origLevelsDoc(id)
  })
}

describe('UrgencyLevelService', () => {
  let db: any
  let service: UrgencyLevelService

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createMockFirestore()
    service = new UrgencyLevelService(db)
  })

  // ==========================================
  // listUrgencyLevels
  // ==========================================
  describe('listUrgencyLevels', () => {
    it('should create default 5 levels on first call when none exist', async () => {
      // First call: empty, triggers creation
      setLevelsQueryResults(db, [])

      // After batch commit, simulate the levels existing
      const defaultLevels = [
        makeLevel({ id: 'auto-1', name: '緊急', color: '#DC2626', icon: '🔴', order: 0, isDefault: true }),
        makeLevel({ id: 'auto-2', name: '高', color: '#EA580C', icon: '🟠', order: 1, isDefault: true }),
        makeLevel({ id: 'auto-3', name: '中', color: '#CA8A04', icon: '🟡', order: 2, isDefault: true }),
        makeLevel({ id: 'auto-4', name: '低', color: '#2563EB', icon: '🔵', order: 3, isDefault: true }),
        makeLevel({ id: 'auto-5', name: 'なし', color: '#6B7280', icon: '⚪', order: 4, isDefault: true }),
      ]

      let callCount = 0
      db._mockLevelsQuery.get.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: empty
          return Promise.resolve(makeQuerySnap([]))
        }
        // Second call: after creation
        return Promise.resolve(makeQuerySnap(defaultLevels))
      })

      const result = await service.listUrgencyLevels('user-1')
      expect(result).toHaveLength(5)
      expect(db._mockBatch.set).toHaveBeenCalledTimes(5)
      expect(db._mockBatch.commit).toHaveBeenCalledTimes(1)
    })

    it('should not recreate defaults when levels already exist', async () => {
      const existingLevels = [
        makeLevel({ id: 'level-1', name: '緊急', order: 0 }),
        makeLevel({ id: 'level-2', name: '高', order: 1 }),
      ]
      setLevelsQueryResults(db, existingLevels)

      const result = await service.listUrgencyLevels('user-1')
      expect(result).toHaveLength(2)
      expect(db._mockBatch.set).not.toHaveBeenCalled()
    })

    it('should return levels ordered by order field', async () => {
      const levels = [
        makeLevel({ id: 'a', name: '低', order: 3 }),
        makeLevel({ id: 'b', name: '緊急', order: 0 }),
      ]
      setLevelsQueryResults(db, levels)

      const result = await service.listUrgencyLevels('user-1')
      expect(result).toHaveLength(2)
      // orderBy is called on the query
      expect(db._mockLevelsQuery.orderBy).toHaveBeenCalledWith('order', 'asc')
    })

    it('should use correct Firestore path for user', async () => {
      setLevelsQueryResults(db, [makeLevel()])

      await service.listUrgencyLevels('user-abc')
      expect(db.collection).toHaveBeenCalledWith('users/user-abc/urgencyLevels')
    })
  })

  // ==========================================
  // createUrgencyLevel
  // ==========================================
  describe('createUrgencyLevel', () => {
    it('should create a new custom urgency level', async () => {
      // Existing levels for order calculation
      setLevelsQueryResults(db, [
        makeLevel({ id: 'a', order: 0 }),
        makeLevel({ id: 'b', order: 1 }),
      ])

      const result = await service.createUrgencyLevel('user-1', {
        name: 'カスタム',
        color: '#FF0000',
        icon: '🔥',
      })

      expect(result.name).toBe('カスタム')
      expect(result.color).toBe('#FF0000')
      expect(result.icon).toBe('🔥')
      expect(result.order).toBe(2)
      expect(result.isDefault).toBe(false)
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should set order to 0 when no levels exist', async () => {
      setLevelsQueryResults(db, [])

      const result = await service.createUrgencyLevel('user-1', {
        name: 'First',
        color: '#000000',
        icon: 'F',
      })

      expect(result.order).toBe(0)
    })

    it('should always set isDefault to false for custom levels', async () => {
      setLevelsQueryResults(db, [])

      const result = await service.createUrgencyLevel('user-1', {
        name: 'Custom',
        color: '#123456',
        icon: 'C',
      })

      expect(result.isDefault).toBe(false)
    })

    it('should validate input data', async () => {
      setLevelsQueryResults(db, [])

      await expect(
        service.createUrgencyLevel('user-1', {
          name: '',
          color: '#000000',
          icon: 'X',
        })
      ).rejects.toThrow()
    })
  })

  // ==========================================
  // updateUrgencyLevel
  // ==========================================
  describe('updateUrgencyLevel', () => {
    it('should update an existing urgency level', async () => {
      const existing = makeLevel({ id: 'level-1', name: '緊急', color: '#DC2626' })
      setDocGetResult(db, 'level-1', existing)

      const result = await service.updateUrgencyLevel('user-1', 'level-1', {
        name: 'Updated',
        color: '#FF0000',
      })

      expect(result).not.toBeNull()
      expect(result!.name).toBe('Updated')
      expect(result!.color).toBe('#FF0000')
      expect(result!.updatedAt).not.toBe(existing.updatedAt)
    })

    it('should return null for non-existent level', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.updateUrgencyLevel('user-1', 'missing', {
        name: 'Nope',
      })

      expect(result).toBeNull()
    })

    it('should update only provided fields', async () => {
      const existing = makeLevel({ id: 'level-1', name: '緊急', color: '#DC2626', icon: '🔴' })
      setDocGetResult(db, 'level-1', existing)

      const result = await service.updateUrgencyLevel('user-1', 'level-1', {
        name: 'Updated Name',
      })

      expect(result).not.toBeNull()
      expect(result!.name).toBe('Updated Name')
      expect(result!.color).toBe('#DC2626')
      expect(result!.icon).toBe('🔴')
    })

    it('should update updatedAt timestamp', async () => {
      const existing = makeLevel({ id: 'level-1', updatedAt: '2026-01-01T00:00:00.000Z' })
      setDocGetResult(db, 'level-1', existing)

      const result = await service.updateUrgencyLevel('user-1', 'level-1', {
        icon: '🟢',
      })

      expect(result).not.toBeNull()
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
    })
  })

  // ==========================================
  // deleteUrgencyLevel
  // ==========================================
  describe('deleteUrgencyLevel', () => {
    it('should throw error when deleting a default level', async () => {
      const defaultLevel = makeLevel({ id: 'level-1', isDefault: true })
      setDocGetResult(db, 'level-1', defaultLevel)

      await expect(
        service.deleteUrgencyLevel('user-1', 'level-1')
      ).rejects.toThrow(/default/)
    })

    it('should delete a custom (non-default) level', async () => {
      const customLevel = makeLevel({ id: 'custom-1', isDefault: false })
      setDocGetResult(db, 'custom-1', customLevel)
      setTodosQueryResults(db, [])

      await expect(
        service.deleteUrgencyLevel('user-1', 'custom-1')
      ).resolves.not.toThrow()
    })

    it('should return null for non-existent level', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.deleteUrgencyLevel('user-1', 'missing')
      expect(result).toBeNull()
    })

    it('should nullify urgencyLevelId on referencing todos', async () => {
      const customLevel = makeLevel({ id: 'custom-1', isDefault: false })
      setDocGetResult(db, 'custom-1', customLevel)

      // Simulate todos referencing this level
      const referencingTodos = [
        { id: 'todo-1', urgencyLevelId: 'custom-1' },
        { id: 'todo-2', urgencyLevelId: 'custom-1' },
      ]
      setTodosQueryResults(db, referencingTodos as any)

      await service.deleteUrgencyLevel('user-1', 'custom-1')

      // Batch should have update calls to nullify urgencyLevelId
      expect(db._mockBatch.update).toHaveBeenCalledTimes(2)
      expect(db._mockBatch.delete).toHaveBeenCalledTimes(1)
      expect(db._mockBatch.commit).toHaveBeenCalled()
    })

    it('should delete level even when no todos reference it', async () => {
      const customLevel = makeLevel({ id: 'custom-1', isDefault: false })
      setDocGetResult(db, 'custom-1', customLevel)
      setTodosQueryResults(db, [])

      await service.deleteUrgencyLevel('user-1', 'custom-1')

      expect(db._mockBatch.delete).toHaveBeenCalledTimes(1)
      expect(db._mockBatch.commit).toHaveBeenCalled()
    })

    it('should use correct query to find referencing todos', async () => {
      const customLevel = makeLevel({ id: 'custom-1', isDefault: false })
      setDocGetResult(db, 'custom-1', customLevel)
      setTodosQueryResults(db, [])

      await service.deleteUrgencyLevel('user-1', 'custom-1')

      expect(db._mockTodosQuery.where).toHaveBeenCalledWith(
        'urgencyLevelId',
        '==',
        'custom-1'
      )
    })
  })
})
