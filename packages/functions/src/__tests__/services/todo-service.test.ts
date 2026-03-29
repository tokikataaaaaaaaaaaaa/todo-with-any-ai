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

type MockFirestore = {
  collection: ReturnType<typeof vi.fn>
  _docMocks: Map<string, ReturnType<typeof vi.fn>>
  _queryResults: Todo[]
  _batchOps: Array<{ type: string; ref: unknown }>
}

function createMockFirestore(): MockFirestore {
  const docMocks = new Map<string, ReturnType<typeof vi.fn>>()
  let queryResults: Todo[] = []
  const batchOps: Array<{ type: string; ref: unknown }> = []

  const mockBatch = {
    delete: vi.fn((ref) => batchOps.push({ type: 'delete', ref })),
    commit: vi.fn().mockResolvedValue(undefined),
  }

  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockImplementation(() => Promise.resolve(makeQuerySnap(queryResults))),
  }

  const mockDocRef = (path: string) => {
    const getMock = docMocks.get(path) ?? vi.fn().mockResolvedValue(makeDocSnap(null, false))
    return {
      id: path.split('/').pop() ?? path,
      get: getMock,
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
    _docMocks: docMocks,
    _queryResults: queryResults,
    _batchOps: batchOps,
    _mockCollectionRef: mockCollectionRef,
    _mockQuery: mockQuery,
    _mockBatch: mockBatch,
    _mockDocRef: mockDocRef,
  }

  return mockFirestore as unknown as MockFirestore
}

// Helper to set up doc get mock for a specific doc id
function setDocGetResult(db: any, docId: string, todo: Todo | null) {
  const snap = todo ? makeDocSnap(todo, true) : makeDocSnap(null, false)
  const getMock = vi.fn().mockResolvedValue(snap)
  // Override the doc method to return proper ref for this id
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

describe('TodoService', () => {
  let db: any
  let service: TodoService

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createMockFirestore()
    service = new TodoService(db)
  })

  // ==========================================
  // listTodos
  // ==========================================
  describe('listTodos', () => {
    it('should return all todos ordered by order ascending', async () => {
      const todos = [
        makeTodo({ id: 'a', order: 0 }),
        makeTodo({ id: 'b', order: 1 }),
        makeTodo({ id: 'c', order: 2 }),
      ]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1')
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('a')
      expect(result[2].id).toBe('c')
    })

    it('should filter by completed=false to return only incomplete todos', async () => {
      const todos = [makeTodo({ id: 'a', completed: false })]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { completed: false })
      expect(result).toHaveLength(1)
      expect(result[0].completed).toBe(false)
      expect(db._mockQuery.where).toHaveBeenCalledWith('completed', '==', false)
    })

    it('should filter by completed=true to return only completed todos', async () => {
      const todos = [makeTodo({ id: 'a', completed: true })]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { completed: true })
      expect(result).toHaveLength(1)
      expect(db._mockQuery.where).toHaveBeenCalledWith('completed', '==', true)
    })

    it('should filter by parentId=null to return only root todos', async () => {
      const todos = [makeTodo({ id: 'a', parentId: null })]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { parentId: null })
      expect(result).toHaveLength(1)
      expect(db._mockQuery.where).toHaveBeenCalledWith('parentId', '==', null)
    })

    it('should filter by specific parentId to return only children', async () => {
      const todos = [makeTodo({ id: 'child-1', parentId: 'parent-1' })]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { parentId: 'parent-1' })
      expect(result).toHaveLength(1)
      expect(result[0].parentId).toBe('parent-1')
    })

    it('should return empty array when no todos exist', async () => {
      setQueryResults(db, [])

      const result = await service.listTodos('user-1')
      expect(result).toEqual([])
    })

    it('should apply multiple filters simultaneously', async () => {
      const todos = [makeTodo({ id: 'a', completed: false, parentId: null })]
      setQueryResults(db, todos)

      const result = await service.listTodos('user-1', { completed: false, parentId: null })
      expect(result).toHaveLength(1)
      expect(db._mockQuery.where).toHaveBeenCalledWith('completed', '==', false)
      expect(db._mockQuery.where).toHaveBeenCalledWith('parentId', '==', null)
    })
  })

  // ==========================================
  // getTodoTree
  // ==========================================
  describe('getTodoTree', () => {
    it('should build a tree from flat list', async () => {
      const todos = [
        makeTodo({ id: 'root', parentId: null, depth: 0 }),
        makeTodo({ id: 'child-1', parentId: 'root', depth: 1 }),
        makeTodo({ id: 'child-2', parentId: 'root', depth: 1 }),
      ]
      setQueryResults(db, todos)

      const result = await service.getTodoTree('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('root')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].id).toBe('child-1')
      expect(result[0].children[1].id).toBe('child-2')
    })

    it('should build a tree with depth 3', async () => {
      const todos = [
        makeTodo({ id: 'root', parentId: null, depth: 0 }),
        makeTodo({ id: 'child', parentId: 'root', depth: 1 }),
        makeTodo({ id: 'grandchild', parentId: 'child', depth: 2 }),
      ]
      setQueryResults(db, todos)

      const result = await service.getTodoTree('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].children).toHaveLength(1)
      expect(result[0].children[0].children[0].id).toBe('grandchild')
    })

    it('should return only root nodes at top level', async () => {
      const todos = [
        makeTodo({ id: 'root-1', parentId: null }),
        makeTodo({ id: 'root-2', parentId: null }),
      ]
      setQueryResults(db, todos)

      const result = await service.getTodoTree('user-1')
      expect(result).toHaveLength(2)
      expect(result[0].children).toEqual([])
      expect(result[1].children).toEqual([])
    })

    it('should return empty array when no todos exist', async () => {
      setQueryResults(db, [])

      const result = await service.getTodoTree('user-1')
      expect(result).toEqual([])
    })
  })

  // ==========================================
  // getTodo
  // ==========================================
  describe('getTodo', () => {
    it('should return the todo when it exists', async () => {
      const todo = makeTodo({ id: 'todo-1' })
      setDocGetResult(db, 'todo-1', todo)

      const result = await service.getTodo('user-1', 'todo-1')
      expect(result).not.toBeNull()
      expect(result!.id).toBe('todo-1')
      expect(result!.title).toBe('Test Todo')
    })

    it('should return null when todo does not exist', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.getTodo('user-1', 'missing')
      expect(result).toBeNull()
    })
  })

  // ==========================================
  // createTodo
  // ==========================================
  describe('createTodo', () => {
    it('should create a todo with title and default values', async () => {
      setQueryResults(db, [])

      const result = await service.createTodo('user-1', { title: 'New Todo' })
      expect(result.title).toBe('New Todo')
      expect(result.completed).toBe(false)
      expect(result.dueDate).toBeNull()
      expect(result.parentId).toBeNull()
      expect(result.depth).toBe(0)
      expect(result.order).toBe(0)
      expect(result.priority).toBeNull()
      expect(result.categoryIcon).toBeNull()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.id).toBeDefined()
    })

    it('should set depth = parent.depth + 1 when parentId is specified', async () => {
      const parent = makeTodo({ id: 'parent', depth: 3 })
      setDocGetResult(db, 'parent', parent)
      setQueryResults(db, [])

      const result = await service.createTodo('user-1', {
        title: 'Child Todo',
        parentId: 'parent',
      })
      expect(result.depth).toBe(4)
      expect(result.parentId).toBe('parent')
    })

    it('should throw error when parent depth is 10 (max depth exceeded)', async () => {
      const parent = makeTodo({ id: 'deep-parent', depth: 10 })
      setDocGetResult(db, 'deep-parent', parent)

      await expect(
        service.createTodo('user-1', { title: 'Too Deep', parentId: 'deep-parent' })
      ).rejects.toThrow(/depth|深/)
    })

    it('should throw error when parent does not exist', async () => {
      setDocGetResult(db, 'nonexistent', null)

      await expect(
        service.createTodo('user-1', { title: 'Orphan', parentId: 'nonexistent' })
      ).rejects.toThrow()
    })

    it('should accept title of 255 characters', async () => {
      setQueryResults(db, [])
      const title = 'a'.repeat(255)

      const result = await service.createTodo('user-1', { title })
      expect(result.title).toBe(title)
    })

    it('should throw error for title of 256 characters', async () => {
      const title = 'a'.repeat(256)

      await expect(service.createTodo('user-1', { title })).rejects.toThrow()
    })

    it('should throw error for empty title', async () => {
      await expect(service.createTodo('user-1', { title: '' })).rejects.toThrow()
    })

    it('should save priority when specified', async () => {
      setQueryResults(db, [])

      const result = await service.createTodo('user-1', {
        title: 'Priority Todo',
        priority: 'high',
      })
      expect(result.priority).toBe('high')
    })

    it('should save categoryIcon when specified', async () => {
      setQueryResults(db, [])

      const result = await service.createTodo('user-1', {
        title: 'Category Todo',
        categoryIcon: 'work',
      })
      expect(result.categoryIcon).toBe('work')
    })

    it('should auto-calculate order as last in sibling group', async () => {
      // Existing siblings at order 0, 1, 2
      setQueryResults(db, [
        makeTodo({ id: 'a', order: 0 }),
        makeTodo({ id: 'b', order: 1 }),
        makeTodo({ id: 'c', order: 2 }),
      ])

      const result = await service.createTodo('user-1', { title: 'New' })
      expect(result.order).toBe(3)
    })

    it('should set dueDate when provided', async () => {
      setQueryResults(db, [])

      const result = await service.createTodo('user-1', {
        title: 'Due Todo',
        dueDate: '2026-12-31',
      })
      expect(result.dueDate).toBe('2026-12-31')
    })
  })

  // ==========================================
  // updateTodo
  // ==========================================
  describe('updateTodo', () => {
    it('should update title and updatedAt', async () => {
      const existing = makeTodo({ id: 'todo-1', updatedAt: '2026-01-01T00:00:00.000Z' })
      setDocGetResult(db, 'todo-1', existing)

      const result = await service.updateTodo('user-1', 'todo-1', { title: 'Updated' })
      expect(result).not.toBeNull()
      expect(result!.title).toBe('Updated')
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
    })

    it('should set dueDate', async () => {
      const existing = makeTodo({ id: 'todo-1', dueDate: null })
      setDocGetResult(db, 'todo-1', existing)

      const result = await service.updateTodo('user-1', 'todo-1', { dueDate: '2026-06-15' })
      expect(result!.dueDate).toBe('2026-06-15')
    })

    it('should clear dueDate with null', async () => {
      const existing = makeTodo({ id: 'todo-1', dueDate: '2026-06-15' })
      setDocGetResult(db, 'todo-1', existing)

      const result = await service.updateTodo('user-1', 'todo-1', { dueDate: null })
      expect(result!.dueDate).toBeNull()
    })

    it('should return null for non-existent todo', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.updateTodo('user-1', 'missing', { title: 'Nope' })
      expect(result).toBeNull()
    })

    it('should update only updatedAt when given empty object', async () => {
      const existing = makeTodo({ id: 'todo-1', updatedAt: '2026-01-01T00:00:00.000Z' })
      setDocGetResult(db, 'todo-1', existing)

      const result = await service.updateTodo('user-1', 'todo-1', {})
      expect(result).not.toBeNull()
      expect(result!.title).toBe('Test Todo')
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
    })
  })

  // ==========================================
  // deleteTodo
  // ==========================================
  describe('deleteTodo', () => {
    it('should delete a single todo with no children and return 1', async () => {
      const todo = makeTodo({ id: 'todo-1' })
      setDocGetResult(db, 'todo-1', todo)
      // Query for children returns empty
      setQueryResults(db, [])

      const result = await service.deleteTodo('user-1', 'todo-1')
      expect(result).toBe(1)
    })

    it('should delete parent and 2 children returning 3', async () => {
      const parent = makeTodo({ id: 'parent', parentId: null })
      const child1 = makeTodo({ id: 'child-1', parentId: 'parent' })
      const child2 = makeTodo({ id: 'child-2', parentId: 'parent' })
      setDocGetResult(db, 'parent', parent)

      // First query: children of parent
      // Second query: children of child-1
      // Third query: children of child-2
      let callCount = 0
      db._mockQuery.get.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve(makeQuerySnap([child1, child2]))
        }
        return Promise.resolve(makeQuerySnap([]))
      })

      const result = await service.deleteTodo('user-1', 'parent')
      expect(result).toBe(3)
    })

    it('should cascade delete through depth 3', async () => {
      const root = makeTodo({ id: 'root' })
      const child = makeTodo({ id: 'child', parentId: 'root' })
      const grandchild = makeTodo({ id: 'grandchild', parentId: 'child' })
      setDocGetResult(db, 'root', root)

      let callCount = 0
      db._mockQuery.get.mockImplementation(() => {
        callCount++
        if (callCount === 1) return Promise.resolve(makeQuerySnap([child]))
        if (callCount === 2) return Promise.resolve(makeQuerySnap([grandchild]))
        return Promise.resolve(makeQuerySnap([]))
      })

      const result = await service.deleteTodo('user-1', 'root')
      expect(result).toBe(3)
    })

    it('should return 0 for non-existent todo', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.deleteTodo('user-1', 'missing')
      expect(result).toBe(0)
    })
  })

  // ==========================================
  // toggleComplete
  // ==========================================
  describe('toggleComplete', () => {
    it('should toggle false to true', async () => {
      const todo = makeTodo({ id: 'todo-1', completed: false })
      setDocGetResult(db, 'todo-1', todo)

      const result = await service.toggleComplete('user-1', 'todo-1')
      expect(result).not.toBeNull()
      expect(result!.completed).toBe(true)
    })

    it('should toggle true to false', async () => {
      const todo = makeTodo({ id: 'todo-1', completed: true })
      setDocGetResult(db, 'todo-1', todo)

      const result = await service.toggleComplete('user-1', 'todo-1')
      expect(result).not.toBeNull()
      expect(result!.completed).toBe(false)
    })

    it('should return null for non-existent todo', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.toggleComplete('user-1', 'missing')
      expect(result).toBeNull()
    })
  })
})
