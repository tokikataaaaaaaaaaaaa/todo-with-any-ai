import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SprintService } from '../../services/sprint-service'
import type { Sprint, CreateSprint } from '@todo-with-any-ai/shared'

// Mock Firestore
function createMockDoc(id: string, data: Record<string, unknown>, exists = true) {
  return {
    id,
    exists,
    data: () => (exists ? data : undefined),
    ref: { id },
  }
}

function createMockFirestore() {
  const docs: Map<string, Record<string, unknown>> = new Map()

  const mockDocRef = (id: string) => ({
    id,
    get: vi.fn(async () => {
      const data = docs.get(id)
      return createMockDoc(id, data || {}, !!data)
    }),
    set: vi.fn(async (data: Record<string, unknown>) => {
      docs.set(id, data)
    }),
    update: vi.fn(async (data: Record<string, unknown>) => {
      const existing = docs.get(id) || {}
      docs.set(id, { ...existing, ...data })
    }),
    delete: vi.fn(async () => {
      docs.delete(id)
    }),
  })

  let docCounter = 0
  const mockCollection = {
    doc: vi.fn((id?: string) => {
      const docId = id || `auto-${++docCounter}`
      return mockDocRef(docId)
    }),
    orderBy: vi.fn(() => ({
      get: vi.fn(async () => ({
        docs: Array.from(docs.entries()).map(([id, data]) => createMockDoc(id, data)),
        size: docs.size,
      })),
    })),
  }

  const db = {
    collection: vi.fn(() => mockCollection),
    _docs: docs,
    _mockCollection: mockCollection,
  }

  return db as unknown as FirebaseFirestore.Firestore & {
    _docs: Map<string, Record<string, unknown>>
    _mockCollection: typeof mockCollection
  }
}

describe('SprintService', () => {
  let db: ReturnType<typeof createMockFirestore>
  let service: SprintService

  beforeEach(() => {
    vi.clearAllMocks()
    db = createMockFirestore()
    service = new SprintService(db as unknown as FirebaseFirestore.Firestore)
  })

  describe('createSprint', () => {
    it('should create a sprint with valid data', async () => {
      const data: CreateSprint = {
        name: 'Week 14',
        startDate: '2026-03-30',
        endDate: '2026-04-06',
        todoIds: ['todo-1'],
      }

      const result = await service.createSprint('user-1', data)

      expect(result.name).toBe('Week 14')
      expect(result.startDate).toBe('2026-03-30')
      expect(result.endDate).toBe('2026-04-06')
      expect(result.todoIds).toEqual(['todo-1'])
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should create a sprint with empty todoIds when omitted', async () => {
      const data: CreateSprint = {
        name: 'Sprint',
        startDate: '2026-03-30',
        endDate: '2026-04-06',
      }

      const result = await service.createSprint('user-1', data)
      expect(result.todoIds).toEqual([])
    })

    it('should use users/{userId}/sprints collection path', async () => {
      const data: CreateSprint = {
        name: 'Sprint',
        startDate: '2026-03-30',
        endDate: '2026-04-06',
      }

      await service.createSprint('user-1', data)
      expect(db.collection).toHaveBeenCalledWith('users/user-1/sprints')
    })
  })

  describe('listSprints', () => {
    it('should return empty array when no sprints exist', async () => {
      const result = await service.listSprints('user-1')
      expect(result).toEqual([])
    })

    it('should return sprints ordered by createdAt', async () => {
      // Pre-populate
      db._docs.set('sprint-1', {
        name: 'Sprint 1',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: [],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.listSprints('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Sprint 1')
      expect(result[0].id).toBe('sprint-1')
    })
  })

  describe('getSprint', () => {
    it('should return null for non-existent sprint', async () => {
      const result = await service.getSprint('user-1', 'non-existent')
      expect(result).toBeNull()
    })

    it('should return sprint when it exists', async () => {
      db._docs.set('sprint-1', {
        name: 'Sprint 1',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: ['todo-1'],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.getSprint('user-1', 'sprint-1')
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Sprint 1')
      expect(result!.todoIds).toEqual(['todo-1'])
    })
  })

  describe('updateSprint', () => {
    it('should return null for non-existent sprint', async () => {
      const result = await service.updateSprint('user-1', 'non-existent', { name: 'Updated' })
      expect(result).toBeNull()
    })

    it('should update sprint fields', async () => {
      db._docs.set('sprint-1', {
        name: 'Original',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: [],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.updateSprint('user-1', 'sprint-1', { name: 'Updated' })
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Updated')
    })
  })

  describe('deleteSprint', () => {
    it('should return 0 for non-existent sprint', async () => {
      const result = await service.deleteSprint('user-1', 'non-existent')
      expect(result).toBe(0)
    })

    it('should delete an existing sprint and return 1', async () => {
      db._docs.set('sprint-1', {
        name: 'Sprint',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: [],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.deleteSprint('user-1', 'sprint-1')
      expect(result).toBe(1)
    })
  })

  describe('addTodoToSprint', () => {
    it('should return null for non-existent sprint', async () => {
      const result = await service.addTodoToSprint('user-1', 'non-existent', 'todo-1')
      expect(result).toBeNull()
    })

    it('should add todoId to sprint', async () => {
      db._docs.set('sprint-1', {
        name: 'Sprint',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: [],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.addTodoToSprint('user-1', 'sprint-1', 'todo-1')
      expect(result).not.toBeNull()
      expect(result!.todoIds).toContain('todo-1')
    })

    it('should not add duplicate todoId', async () => {
      db._docs.set('sprint-1', {
        name: 'Sprint',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: ['todo-1'],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.addTodoToSprint('user-1', 'sprint-1', 'todo-1')
      expect(result).not.toBeNull()
      expect(result!.todoIds).toEqual(['todo-1'])
    })
  })

  describe('removeTodoFromSprint', () => {
    it('should return null for non-existent sprint', async () => {
      const result = await service.removeTodoFromSprint('user-1', 'non-existent', 'todo-1')
      expect(result).toBeNull()
    })

    it('should remove todoId from sprint', async () => {
      db._docs.set('sprint-1', {
        name: 'Sprint',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: ['todo-1', 'todo-2'],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.removeTodoFromSprint('user-1', 'sprint-1', 'todo-1')
      expect(result).not.toBeNull()
      expect(result!.todoIds).toEqual(['todo-2'])
    })

    it('should do nothing when todoId is not in sprint', async () => {
      db._docs.set('sprint-1', {
        name: 'Sprint',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        todoIds: ['todo-1'],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })

      const result = await service.removeTodoFromSprint('user-1', 'sprint-1', 'todo-999')
      expect(result).not.toBeNull()
      expect(result!.todoIds).toEqual(['todo-1'])
    })
  })
})
