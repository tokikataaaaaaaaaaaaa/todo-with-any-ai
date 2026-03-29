import { createUrgencyLevelSchema } from '@todo-with-any-ai/shared'
import type { UrgencyLevel, CreateUrgencyLevel, UpdateUrgencyLevel } from '@todo-with-any-ai/shared'

const DEFAULT_LEVELS = [
  { name: '緊急', color: '#DC2626', icon: '🔴', order: 0 },
  { name: '高', color: '#EA580C', icon: '🟠', order: 1 },
  { name: '中', color: '#CA8A04', icon: '🟡', order: 2 },
  { name: '低', color: '#2563EB', icon: '🔵', order: 3 },
  { name: 'なし', color: '#6B7280', icon: '⚪', order: 4 },
]

export class UrgencyLevelService {
  constructor(private db: FirebaseFirestore.Firestore) {}

  private levelsCollection(userId: string) {
    return this.db.collection(`users/${userId}/urgencyLevels`)
  }

  private todosCollection(userId: string) {
    return this.db.collection(`users/${userId}/todos`)
  }

  async listUrgencyLevels(userId: string): Promise<UrgencyLevel[]> {
    const collection = this.levelsCollection(userId)
    let query: FirebaseFirestore.Query = collection
    query = query.orderBy('order', 'asc')
    const snapshot = await query.get()

    if (snapshot.empty) {
      await this.createDefaults(userId)
      const refreshed = await collection.orderBy('order', 'asc').get()
      return refreshed.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UrgencyLevel[]
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UrgencyLevel[]
  }

  private async createDefaults(userId: string): Promise<void> {
    const batch = this.db.batch()
    const collection = this.levelsCollection(userId)
    const now = new Date().toISOString()

    for (const level of DEFAULT_LEVELS) {
      const docRef = collection.doc()
      batch.set(docRef, {
        name: level.name,
        color: level.color,
        icon: level.icon,
        order: level.order,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    await batch.commit()
  }

  async createUrgencyLevel(
    userId: string,
    data: CreateUrgencyLevel
  ): Promise<UrgencyLevel> {
    // Validate input
    const parsed = createUrgencyLevelSchema.parse(data)

    // Calculate order: count existing levels
    const collection = this.levelsCollection(userId)
    const snapshot = await collection.get()
    const order = snapshot.size

    const now = new Date().toISOString()
    const docRef = collection.doc()
    const levelData: Omit<UrgencyLevel, 'id'> = {
      name: parsed.name,
      color: parsed.color,
      icon: parsed.icon,
      order,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(levelData)

    return { id: docRef.id, ...levelData }
  }

  async updateUrgencyLevel(
    userId: string,
    levelId: string,
    data: UpdateUrgencyLevel
  ): Promise<UrgencyLevel | null> {
    const docRef = this.levelsCollection(userId).doc(levelId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as UrgencyLevel
    const now = new Date().toISOString()

    const updateData: Partial<UrgencyLevel> & { updatedAt: string } = {
      ...data,
      updatedAt: now,
    }

    await docRef.update(updateData)

    return { ...existing, ...updateData }
  }

  async deleteUrgencyLevel(
    userId: string,
    levelId: string
  ): Promise<true | null> {
    const docRef = this.levelsCollection(userId).doc(levelId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const level = { id: doc.id, ...doc.data() } as UrgencyLevel

    if (level.isDefault) {
      throw new Error('Cannot delete default urgency level')
    }

    // Find todos referencing this level and nullify their urgencyLevelId
    const todosQuery = this.todosCollection(userId).where(
      'urgencyLevelId',
      '==',
      levelId
    )
    const todosSnapshot = await todosQuery.get()

    const batch = this.db.batch()

    for (const todoDoc of todosSnapshot.docs) {
      batch.update(this.todosCollection(userId).doc(todoDoc.id), {
        urgencyLevelId: null,
      })
    }

    batch.delete(docRef)
    await batch.commit()

    return true
  }
}
