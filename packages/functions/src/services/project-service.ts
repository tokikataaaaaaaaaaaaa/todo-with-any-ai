import { createProjectSchema } from '@todo-with-any-ai/shared'
import type { Project, CreateProject, UpdateProject } from '@todo-with-any-ai/shared'

export class ProjectService {
  constructor(private db: FirebaseFirestore.Firestore) {}

  private projectsCollection(userId: string) {
    return this.db.collection(`users/${userId}/projects`)
  }

  async createProject(userId: string, data: CreateProject): Promise<Project> {
    const parsed = createProjectSchema.parse(data)

    // Calculate order: count existing projects
    const snapshot = await this.projectsCollection(userId).orderBy('order', 'asc').get()
    const order = snapshot.size

    const now = new Date().toISOString()
    const docRef = this.projectsCollection(userId).doc()
    const projectData: Omit<Project, 'id'> = {
      name: parsed.name,
      color: parsed.color,
      emoji: parsed.emoji,
      order,
      dueDate: parsed.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(projectData)

    return { id: docRef.id, ...projectData }
  }

  async listProjects(userId: string): Promise<Project[]> {
    const query = this.projectsCollection(userId).orderBy('order', 'asc')
    const snapshot = await query.get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  }

  async getProject(userId: string, projectId: string): Promise<Project | null> {
    const doc = await this.projectsCollection(userId).doc(projectId).get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...doc.data() } as Project
  }

  async updateProject(
    userId: string,
    projectId: string,
    data: UpdateProject
  ): Promise<Project | null> {
    const docRef = this.projectsCollection(userId).doc(projectId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as Project
    const now = new Date().toISOString()

    const updateData: Partial<Project> & { updatedAt: string } = {
      ...data,
      updatedAt: now,
    }

    await docRef.update(updateData)

    return { ...existing, ...updateData }
  }

  async deleteProject(userId: string, projectId: string, deleteTodos: boolean = false): Promise<number> {
    const docRef = this.projectsCollection(userId).doc(projectId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return 0
    }

    if (deleteTodos) {
      // Delete all todos associated with this project
      const todosSnapshot = await this.db
        .collection(`users/${userId}/todos`)
        .where('projectId', '==', projectId)
        .get()
      const batch = this.db.batch()
      todosSnapshot.docs.forEach((todoDoc) => batch.delete(todoDoc.ref))
      batch.delete(docRef)
      await batch.commit()
    } else {
      await docRef.delete()
    }

    return 1
  }
}
