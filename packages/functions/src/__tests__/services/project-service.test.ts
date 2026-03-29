import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectService } from '../../services/project-service'
import type { z } from 'zod'
import type { projectSchema } from '@todo-with-any-ai/shared'

type Project = z.infer<typeof projectSchema>

// --- Firestore mock helpers ---

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    color: '#FF5733',
    emoji: '\u{1F4BC}',
    order: 0,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDocSnap(data: Project | null, exists = true) {
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

function makeQuerySnap(docs: Project[]) {
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
  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(makeQuerySnap([])),
  }

  const autoDocRef = {
    id: `auto-${Date.now()}`,
    get: vi.fn().mockResolvedValue(makeDocSnap(null, false)),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }

  const namedDocRefs = new Map<string, ReturnType<typeof createNamedDocRef>>()

  function createNamedDocRef(id: string) {
    return {
      id,
      get: vi.fn().mockResolvedValue(makeDocSnap(null, false)),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }
  }

  const mockCollectionRef = {
    doc: vi.fn((id?: string) => {
      if (!id) return autoDocRef
      if (!namedDocRefs.has(id)) {
        namedDocRefs.set(id, createNamedDocRef(id))
      }
      return namedDocRefs.get(id)!
    }),
    where: mockQuery.where,
    orderBy: mockQuery.orderBy,
    get: mockQuery.get,
  }

  const mockFirestore = {
    collection: vi.fn().mockReturnValue(mockCollectionRef),
    _mockCollectionRef: mockCollectionRef,
    _mockQuery: mockQuery,
    _autoDocRef: autoDocRef,
    _namedDocRefs: namedDocRefs,
  }

  return mockFirestore
}

function setDocGetResult(db: any, docId: string, project: Project | null) {
  const snap = project ? makeDocSnap(project, true) : makeDocSnap(null, false)
  // Ensure named doc ref exists and set its get mock
  if (!db._namedDocRefs.has(docId)) {
    db._mockCollectionRef.doc(docId)
  }
  db._namedDocRefs.get(docId)!.get.mockResolvedValue(snap)
}

function setQueryResults(db: any, projects: Project[]) {
  db._mockQuery.get.mockResolvedValue(makeQuerySnap(projects))
}

describe('ProjectService', () => {
  let db: any
  let service: ProjectService

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createMockFirestore()
    service = new ProjectService(db)
  })

  // ==========================================
  // createProject
  // ==========================================
  describe('createProject', () => {
    it('should create a project with id, createdAt, updatedAt', async () => {
      setQueryResults(db, [])

      const result = await service.createProject('user-1', {
        name: 'Work',
        color: '#FF0000',
        emoji: '\u{1F4BC}',
      })

      expect(result.id).toBeDefined()
      expect(result.name).toBe('Work')
      expect(result.color).toBe('#FF0000')
      expect(result.emoji).toBe('\u{1F4BC}')
      expect(result.order).toBe(0)
      expect(result.dueDate).toBeNull()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.createdAt).toBe(result.updatedAt)
    })

    it('should auto-calculate order based on existing projects count', async () => {
      setQueryResults(db, [
        makeProject({ id: 'a', order: 0 }),
        makeProject({ id: 'b', order: 1 }),
        makeProject({ id: 'c', order: 2 }),
      ])

      const result = await service.createProject('user-1', {
        name: 'Fourth',
        color: '#000000',
        emoji: '4',
      })

      expect(result.order).toBe(3)
    })

    it('should save dueDate when provided', async () => {
      setQueryResults(db, [])

      const result = await service.createProject('user-1', {
        name: 'Deadline Project',
        color: '#00FF00',
        emoji: '\u{23F0}',
        dueDate: '2026-06-30',
      })

      expect(result.dueDate).toBe('2026-06-30')
    })

    it('should validate the input data via schema', async () => {
      await expect(
        service.createProject('user-1', {
          name: '',
          color: '#000000',
          emoji: 'X',
        })
      ).rejects.toThrow()
    })

    it('should reject invalid color format', async () => {
      await expect(
        service.createProject('user-1', {
          name: 'Bad Color',
          color: 'red',
          emoji: 'X',
        })
      ).rejects.toThrow()
    })

    it('should call Firestore set with correct collection path', async () => {
      setQueryResults(db, [])

      await service.createProject('user-1', {
        name: 'Test',
        color: '#AABBCC',
        emoji: 'T',
      })

      expect(db.collection).toHaveBeenCalledWith('users/user-1/projects')
    })
  })

  // ==========================================
  // listProjects
  // ==========================================
  describe('listProjects', () => {
    it('should return projects ordered by order ascending', async () => {
      const projects = [
        makeProject({ id: 'a', name: 'First', order: 0 }),
        makeProject({ id: 'b', name: 'Second', order: 1 }),
        makeProject({ id: 'c', name: 'Third', order: 2 }),
      ]
      setQueryResults(db, projects)

      const result = await service.listProjects('user-1')
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('a')
      expect(result[1].id).toBe('b')
      expect(result[2].id).toBe('c')
    })

    it('should call orderBy with order asc', async () => {
      setQueryResults(db, [])

      await service.listProjects('user-1')
      expect(db._mockQuery.orderBy).toHaveBeenCalledWith('order', 'asc')
    })

    it('should return empty array when no projects exist', async () => {
      setQueryResults(db, [])

      const result = await service.listProjects('user-1')
      expect(result).toEqual([])
    })

    it('should use correct collection path', async () => {
      setQueryResults(db, [])

      await service.listProjects('user-42')
      expect(db.collection).toHaveBeenCalledWith('users/user-42/projects')
    })
  })

  // ==========================================
  // getProject
  // ==========================================
  describe('getProject', () => {
    it('should return project when it exists', async () => {
      const project = makeProject({ id: 'proj-1', name: 'My Project' })
      setDocGetResult(db, 'proj-1', project)

      const result = await service.getProject('user-1', 'proj-1')
      expect(result).not.toBeNull()
      expect(result!.id).toBe('proj-1')
      expect(result!.name).toBe('My Project')
    })

    it('should return null when project does not exist', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.getProject('user-1', 'missing')
      expect(result).toBeNull()
    })

    it('should return all fields correctly', async () => {
      const project = makeProject({
        id: 'proj-full',
        name: 'Full Project',
        color: '#ABCDEF',
        emoji: '\u{2B50}',
        order: 5,
        dueDate: '2026-12-25',
      })
      setDocGetResult(db, 'proj-full', project)

      const result = await service.getProject('user-1', 'proj-full')
      expect(result).not.toBeNull()
      expect(result!.color).toBe('#ABCDEF')
      expect(result!.emoji).toBe('\u{2B50}')
      expect(result!.order).toBe(5)
      expect(result!.dueDate).toBe('2026-12-25')
    })
  })

  // ==========================================
  // updateProject
  // ==========================================
  describe('updateProject', () => {
    it('should update name and updatedAt', async () => {
      const existing = makeProject({
        id: 'proj-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
      setDocGetResult(db, 'proj-1', existing)

      const result = await service.updateProject('user-1', 'proj-1', {
        name: 'Updated Name',
      })
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Updated Name')
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
    })

    it('should update color only', async () => {
      const existing = makeProject({ id: 'proj-1', color: '#000000' })
      setDocGetResult(db, 'proj-1', existing)

      const result = await service.updateProject('user-1', 'proj-1', {
        color: '#FFFFFF',
      })
      expect(result).not.toBeNull()
      expect(result!.color).toBe('#FFFFFF')
      expect(result!.name).toBe('Test Project') // unchanged
    })

    it('should update emoji only', async () => {
      const existing = makeProject({ id: 'proj-1' })
      setDocGetResult(db, 'proj-1', existing)

      const result = await service.updateProject('user-1', 'proj-1', {
        emoji: '\u{1F389}',
      })
      expect(result).not.toBeNull()
      expect(result!.emoji).toBe('\u{1F389}')
    })

    it('should update dueDate', async () => {
      const existing = makeProject({ id: 'proj-1', dueDate: null })
      setDocGetResult(db, 'proj-1', existing)

      const result = await service.updateProject('user-1', 'proj-1', {
        dueDate: '2026-08-15',
      })
      expect(result).not.toBeNull()
      expect(result!.dueDate).toBe('2026-08-15')
    })

    it('should clear dueDate with null', async () => {
      const existing = makeProject({ id: 'proj-1', dueDate: '2026-08-15' })
      setDocGetResult(db, 'proj-1', existing)

      const result = await service.updateProject('user-1', 'proj-1', {
        dueDate: null,
      })
      expect(result).not.toBeNull()
      expect(result!.dueDate).toBeNull()
    })

    it('should return null for non-existent project', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.updateProject('user-1', 'missing', {
        name: 'Nope',
      })
      expect(result).toBeNull()
    })

    it('should always update updatedAt even with empty data', async () => {
      const existing = makeProject({
        id: 'proj-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
      setDocGetResult(db, 'proj-1', existing)

      const result = await service.updateProject('user-1', 'proj-1', {})
      expect(result).not.toBeNull()
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
    })

    it('should call Firestore update', async () => {
      const existing = makeProject({ id: 'proj-1' })
      setDocGetResult(db, 'proj-1', existing)

      await service.updateProject('user-1', 'proj-1', { name: 'New' })
      const docRef = db._namedDocRefs.get('proj-1')!
      expect(docRef.update).toHaveBeenCalled()
    })
  })

  // ==========================================
  // deleteProject
  // ==========================================
  describe('deleteProject', () => {
    it('should delete an existing project and return 1', async () => {
      const project = makeProject({ id: 'proj-1' })
      setDocGetResult(db, 'proj-1', project)

      const result = await service.deleteProject('user-1', 'proj-1')
      expect(result).toBe(1)
    })

    it('should call Firestore delete on the doc ref', async () => {
      const project = makeProject({ id: 'proj-1' })
      setDocGetResult(db, 'proj-1', project)

      await service.deleteProject('user-1', 'proj-1')
      const docRef = db._namedDocRefs.get('proj-1')!
      expect(docRef.delete).toHaveBeenCalled()
    })

    it('should return 0 for non-existent project', async () => {
      setDocGetResult(db, 'missing', null)

      const result = await service.deleteProject('user-1', 'missing')
      expect(result).toBe(0)
    })

    it('should not call delete for non-existent project', async () => {
      setDocGetResult(db, 'missing', null)

      await service.deleteProject('user-1', 'missing')
      const docRef = db._namedDocRefs.get('missing')!
      expect(docRef.delete).not.toHaveBeenCalled()
    })

    it('should use correct collection path', async () => {
      const project = makeProject({ id: 'proj-1' })
      setDocGetResult(db, 'proj-1', project)

      await service.deleteProject('user-99', 'proj-1')
      expect(db.collection).toHaveBeenCalledWith('users/user-99/projects')
    })
  })
})
