import { createSprintSchema } from '@todo-with-any-ai/shared'
import type { Sprint, CreateSprint, UpdateSprint } from '@todo-with-any-ai/shared'

export class SprintService {
  constructor(private db: FirebaseFirestore.Firestore) {}

  private sprintsCollection(userId: string) {
    return this.db.collection(`users/${userId}/sprints`)
  }

  async createSprint(userId: string, data: CreateSprint): Promise<Sprint> {
    const parsed = createSprintSchema.parse(data)

    const now = new Date().toISOString()
    const docRef = this.sprintsCollection(userId).doc()
    const sprintData: Omit<Sprint, 'id'> = {
      name: parsed.name,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      todoIds: parsed.todoIds ?? [],
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(sprintData)

    return { id: docRef.id, ...sprintData }
  }

  async listSprints(userId: string): Promise<Sprint[]> {
    const query = this.sprintsCollection(userId).orderBy('createdAt', 'asc')
    const snapshot = await query.get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Sprint[]
  }

  async getSprint(userId: string, sprintId: string): Promise<Sprint | null> {
    const doc = await this.sprintsCollection(userId).doc(sprintId).get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...doc.data() } as Sprint
  }

  async updateSprint(
    userId: string,
    sprintId: string,
    data: UpdateSprint
  ): Promise<Sprint | null> {
    const docRef = this.sprintsCollection(userId).doc(sprintId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as Sprint
    const now = new Date().toISOString()

    const updateData: Partial<Sprint> & { updatedAt: string } = {
      ...data,
      updatedAt: now,
    }

    await docRef.update(updateData)

    return { ...existing, ...updateData }
  }

  async deleteSprint(userId: string, sprintId: string): Promise<number> {
    const docRef = this.sprintsCollection(userId).doc(sprintId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return 0
    }

    await docRef.delete()
    return 1
  }

  async addTodoToSprint(
    userId: string,
    sprintId: string,
    todoId: string
  ): Promise<Sprint | null> {
    const docRef = this.sprintsCollection(userId).doc(sprintId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as Sprint
    const todoIds = existing.todoIds || []

    if (todoIds.includes(todoId)) {
      return existing
    }

    const updatedTodoIds = [...todoIds, todoId]
    const now = new Date().toISOString()

    await docRef.update({ todoIds: updatedTodoIds, updatedAt: now })

    return { ...existing, todoIds: updatedTodoIds, updatedAt: now }
  }

  async removeTodoFromSprint(
    userId: string,
    sprintId: string,
    todoId: string
  ): Promise<Sprint | null> {
    const docRef = this.sprintsCollection(userId).doc(sprintId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as Sprint
    const todoIds = (existing.todoIds || []).filter((id) => id !== todoId)
    const now = new Date().toISOString()

    await docRef.update({ todoIds, updatedAt: now })

    return { ...existing, todoIds, updatedAt: now }
  }
}
