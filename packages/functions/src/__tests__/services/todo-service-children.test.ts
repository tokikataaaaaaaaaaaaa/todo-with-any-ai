import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TodoService } from '../../services/todo-service'
import type { Todo } from '@todo-with-any-ai/shared'

// --- Firestore mock helpers ---

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    title: 'Test Todo',
    completed: false,
    dueDate: null,
    parentId: null,
    order: 0,
    depth: 0,
    priority: null,
    categoryIcon: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDocSnap(data: Todo | null, exists = true) {
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

function makeQuerySnap(docs: Todo[]) {
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
    forEach: (cb: (doc: { id: string; data: () => Omit<Todo, 'id'> }) => void) => {
      docs.forEach((d) => {
        const { id, ...rest } = d
        cb({ id: d.id, data: () => rest })
      })
    },
  }
}

function createMockFirestore() {
  const batchOps: Array<{ type: string; ref: unknown }> = []

  const mockBatch = {
    delete: vi.fn((ref) => batchOps.push({ type: 'delete', ref })),
    commit: vi.fn().mockResolvedValue(undefined),
  }

  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(makeQuerySnap([])),
  }

  const mockDocRef = (path: string) => {
    return {
      id: path.split('/').pop() ?? path,
      get: vi.fn().mockResolvedValue(makeDocSnap(null, false)),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }
  }

  const mockCollectionRef = {
    doc: vi.fn((id?: string) => mockDocRef(id ?? `auto-${Date.now()}`)),
    where: mockQuery.where,
    orderBy: mockQuery.orderBy,
    get: mockQuery.get,
  }

  const mockFirestore = {
    collection: vi.fn().mockReturnValue(mockCollectionRef),
    batch: vi.fn().mockReturnValue(mockBatch),
    _mockCollectionRef: mockCollectionRef,
    _mockQuery: mockQuery,
    _mockBatch: mockBatch,
    _batchOps: batchOps,
  }

  return mockFirestore
}

function setDocGetResult(db: any, docId: string, todo: Todo | null) {
  const snap = todo ? makeDocSnap(todo, true) : makeDocSnap(null, false)
  const getMock = vi.fn().mockResolvedValue(snap)
  const originalDoc = db._mockCollectionRef.doc
  db._mockCollectionRef.doc = vi.fn().mockImplementation((id?: string) => {
    if (id === docId) {
      return {
        id: docId,
        get: getMock,
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      }
    }
    return originalDoc(id)
  })
}

function setQueryResults(db: any, todos: Todo[]) {
  db._mockQuery.get.mockResolvedValue(makeQuerySnap(todos))
}

describe('TodoService - Children & Filtering', () => {
  let db: any
  let service: TodoService

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createMockFirestore()
    service = new TodoService(db)
  })

  // ==========================================
  // getChildrenCount
  // ==========================================
  describe('getChildrenCount', () => {
    it('should return 3 when todo has 3 children', async () => {
      const children = [
        makeTodo({ id: 'c1', parentId: 'parent-1' }),
        makeTodo({ id: 'c2', parentId: 'parent-1' }),
        makeTodo({ id: 'c3', parentId: 'parent-1' }),
      ]
      setQueryResults(db, children)

      const result = await service.getChildrenCount('user-1', 'parent-1')
      expect(result).toBe(3)
    })

    it('should return 0 when todo has no children', async () => {
      setQueryResults(db, [])

      const result = await service.getChildrenCount('user-1', 'parent-1')
      expect(result).toBe(0)
    })

    it('should return 0 when todo does not exist (no children found)', async () => {
      setQueryResults(db, [])

      const result = await service.getChildrenCount('user-1', 'nonexistent')
      expect(result).toBe(0)
    })

    it('should query with correct parentId filter', async () => {
      setQueryResults(db, [])

      await service.getChildrenCount('user-1', 'parent-123')
      expect(db._mockQuery.where).toHaveBeenCalledWith('parentId', '==', 'parent-123')
    })

    it('should return 1 when todo has exactly 1 child', async () => {
      const children = [makeTodo({ id: 'c1', parentId: 'parent-1' })]
      setQueryResults(db, children)

      const result = await service.getChildrenCount('user-1', 'parent-1')
      expect(result).toBe(1)
    })
  })

  // ==========================================
  // listTodos with sort=dueDate
  // ==========================================
  describe('listTodos sort=dueDate', () => {
    it('should sort by dueDate ascending with null at end', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-05-01' }),
        makeTodo({ id: 'b', dueDate: null }),
        makeTodo({ id: 'c', dueDate: '2026-03-01' }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { sort: 'dueDate' })
      expect(result[0].id).toBe('c') // 2026-03-01
      expect(result[1].id).toBe('a') // 2026-05-01
      expect(result[2].id).toBe('b') // null at end
    })

    it('should keep null dueDate items at the end', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: null }),
        makeTodo({ id: 'b', dueDate: null }),
        makeTodo({ id: 'c', dueDate: '2026-01-01' }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { sort: 'dueDate' })
      expect(result[0].id).toBe('c')
      expect(result[1].dueDate).toBeNull()
      expect(result[2].dueDate).toBeNull()
    })

    it('should default to order sort when sort is not specified', async () => {
      const todos = [
        makeTodo({ id: 'a', order: 0 }),
        makeTodo({ id: 'b', order: 1 }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1')
      // Should still use Firestore orderBy('order', 'asc') - no client-side sort
      expect(result[0].id).toBe('a')
      expect(result[1].id).toBe('b')
    })

    it('should sort by dueDate with all dates present', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-12-31' }),
        makeTodo({ id: 'b', dueDate: '2026-01-01' }),
        makeTodo({ id: 'c', dueDate: '2026-06-15' }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { sort: 'dueDate' })
      expect(result[0].id).toBe('b') // 2026-01-01
      expect(result[1].id).toBe('c') // 2026-06-15
      expect(result[2].id).toBe('a') // 2026-12-31
    })
  })

  // ==========================================
  // listTodos with dueBefore
  // ==========================================
  describe('listTodos dueBefore', () => {
    it('should filter todos with dueDate on or before specified date', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-04-01' }),
        makeTodo({ id: 'b', dueDate: '2026-05-01' }),
        makeTodo({ id: 'c', dueDate: '2026-04-30' }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { dueBefore: '2026-04-30' })
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.id).sort()).toEqual(['a', 'c'])
    })

    it('should exclude todos with null dueDate', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-04-01' }),
        makeTodo({ id: 'b', dueDate: null }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { dueBefore: '2026-04-30' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('a')
    })

    it('should include todo with dueDate exactly matching dueBefore', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-04-30' }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { dueBefore: '2026-04-30' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('a')
    })

    it('should return empty when all todos are after dueBefore', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-06-01' }),
        makeTodo({ id: 'b', dueDate: '2026-07-01' }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { dueBefore: '2026-05-01' })
      expect(result).toHaveLength(0)
    })
  })

  // ==========================================
  // listTodos with dueBefore + sort combined
  // ==========================================
  describe('listTodos dueBefore + sort=dueDate combined', () => {
    it('should filter by dueBefore and sort by dueDate ascending', async () => {
      const todos = [
        makeTodo({ id: 'a', dueDate: '2026-04-15' }),
        makeTodo({ id: 'b', dueDate: '2026-05-01' }),
        makeTodo({ id: 'c', dueDate: '2026-03-01' }),
        makeTodo({ id: 'd', dueDate: null }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', {
        dueBefore: '2026-04-30',
        sort: 'dueDate',
      })
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('c') // 2026-03-01
      expect(result[1].id).toBe('a') // 2026-04-15
    })
  })

  // ==========================================
  // listTodos with childrenCount/completedChildrenCount
  // ==========================================
  describe('listTodos childrenCount and completedChildrenCount', () => {
    it('should include childrenCount and completedChildrenCount for parent todos', async () => {
      // Parent at root, with children that will be in the same query
      const todos = [
        makeTodo({ id: 'parent', parentId: null, completed: false }),
        makeTodo({ id: 'child-1', parentId: 'parent', completed: true }),
        makeTodo({ id: 'child-2', parentId: 'parent', completed: false }),
        makeTodo({ id: 'child-3', parentId: 'parent', completed: true }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1')
      const parent = result.find((t) => t.id === 'parent')
      expect(parent).toBeDefined()
      expect((parent as any).childrenCount).toBe(3)
      expect((parent as any).completedChildrenCount).toBe(2)
    })

    it('should set childrenCount=0 and completedChildrenCount=0 for leaf todos', async () => {
      const todos = [
        makeTodo({ id: 'leaf', parentId: null }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1')
      expect((result[0] as any).childrenCount).toBe(0)
      expect((result[0] as any).completedChildrenCount).toBe(0)
    })

    it('should correctly count children for multiple parents', async () => {
      const todos = [
        makeTodo({ id: 'p1', parentId: null }),
        makeTodo({ id: 'p2', parentId: null }),
        makeTodo({ id: 'c1', parentId: 'p1', completed: true }),
        makeTodo({ id: 'c2', parentId: 'p1', completed: false }),
        makeTodo({ id: 'c3', parentId: 'p2', completed: true }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1')
      const p1 = result.find((t) => t.id === 'p1')!
      const p2 = result.find((t) => t.id === 'p2')!
      expect((p1 as any).childrenCount).toBe(2)
      expect((p1 as any).completedChildrenCount).toBe(1)
      expect((p2 as any).childrenCount).toBe(1)
      expect((p2 as any).completedChildrenCount).toBe(1)
    })

    it('should only count direct children, not grandchildren', async () => {
      const todos = [
        makeTodo({ id: 'root', parentId: null }),
        makeTodo({ id: 'child', parentId: 'root', completed: true }),
        makeTodo({ id: 'grandchild', parentId: 'child', completed: true }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1')
      const root = result.find((t) => t.id === 'root')!
      expect((root as any).childrenCount).toBe(1)
      expect((root as any).completedChildrenCount).toBe(1)
    })
  })
})
