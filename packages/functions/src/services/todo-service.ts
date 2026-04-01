import { createTodoSchema } from '@todo-with-any-ai/shared'
import type { Todo, CreateTodo, UpdateTodo } from '@todo-with-any-ai/shared'

// Define TodoTreeNode locally since the shared schema's recursive type
// doesn't infer properly with z.ZodType
interface TodoTreeNode extends Todo {
  children: TodoTreeNode[]
}

export class TodoService {
  constructor(private db: FirebaseFirestore.Firestore) {}

  private todosCollection(userId: string) {
    return this.db.collection(`users/${userId}/todos`)
  }

  async listTodos(
    userId: string,
    filters?: {
      completed?: boolean
      parentId?: string | null
      projectId?: string | null
      sort?: 'order' | 'dueDate'
      dueBefore?: string
    }
  ): Promise<(Todo & { childrenCount: number; completedChildrenCount: number })[]> {
    let query: FirebaseFirestore.Query = this.todosCollection(userId)

    if (filters) {
      if (filters.completed !== undefined) {
        query = query.where('completed', '==', filters.completed)
      }
      if (filters.parentId !== undefined) {
        query = query.where('parentId', '==', filters.parentId)
      }
      if (filters.projectId !== undefined) {
        query = query.where('projectId', '==', filters.projectId)
      }
    }

    query = query.orderBy('order', 'asc')
    const snapshot = await query.get()

    let todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Todo[]

    // Client-side filter: dueBefore
    if (filters?.dueBefore) {
      const cutoff = filters.dueBefore
      todos = todos.filter((t) => t.dueDate !== null && t.dueDate <= cutoff)
    }

    // Client-side sort: dueDate ascending, null at end
    if (filters?.sort === 'dueDate') {
      todos.sort((a, b) => {
        if (a.dueDate === null && b.dueDate === null) return 0
        if (a.dueDate === null) return 1
        if (b.dueDate === null) return -1
        return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
      })
    }

    // Compute childrenCount and completedChildrenCount
    const childrenCountMap = new Map<string, number>()
    const completedChildrenCountMap = new Map<string, number>()
    for (const todo of todos) {
      if (todo.parentId) {
        childrenCountMap.set(todo.parentId, (childrenCountMap.get(todo.parentId) ?? 0) + 1)
        if (todo.completed) {
          completedChildrenCountMap.set(
            todo.parentId,
            (completedChildrenCountMap.get(todo.parentId) ?? 0) + 1
          )
        }
      }
    }

    return todos.map((todo) => ({
      ...todo,
      childrenCount: childrenCountMap.get(todo.id) ?? 0,
      completedChildrenCount: completedChildrenCountMap.get(todo.id) ?? 0,
    }))
  }

  async getChildrenCount(userId: string, todoId: string): Promise<number> {
    const query = this.todosCollection(userId).where('parentId', '==', todoId)
    const snapshot = await query.get()
    return snapshot.size
  }

  async getTodoTree(userId: string): Promise<TodoTreeNode[]> {
    const todos = await this.listTodos(userId)
    return this.buildTree(todos)
  }

  private buildTree(todos: Todo[]): TodoTreeNode[] {
    const nodeMap = new Map<string, TodoTreeNode>()
    const roots: TodoTreeNode[] = []

    // Create nodes with empty children
    for (const todo of todos) {
      nodeMap.set(todo.id, { ...todo, children: [] })
    }

    // Build parent-child relationships
    for (const todo of todos) {
      const node = nodeMap.get(todo.id)!
      if (todo.parentId && nodeMap.has(todo.parentId)) {
        nodeMap.get(todo.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  async getTodo(userId: string, todoId: string): Promise<Todo | null> {
    const doc = await this.todosCollection(userId).doc(todoId).get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...doc.data() } as Todo
  }

  async createTodo(userId: string, data: CreateTodo): Promise<Todo> {
    // Validate title via schema
    const parsed = createTodoSchema.parse(data)

    let depth = 0
    let inheritedProjectId: string | null = null
    if (parsed.parentId) {
      const parentDoc = await this.todosCollection(userId).doc(parsed.parentId).get()
      if (!parentDoc.exists) {
        throw new Error('Parent not found')
      }
      const parentData = parentDoc.data() as Omit<Todo, 'id'>
      if (parentData.depth >= 10) {
        throw new Error('Maximum depth exceeded (max 10)')
      }
      depth = parentData.depth + 1
      // Inherit parent's projectId if not explicitly set
      if (!parsed.projectId && parentData.projectId) {
        inheritedProjectId = parentData.projectId
      }
    }

    // Calculate order: count siblings at same level
    let query: FirebaseFirestore.Query = this.todosCollection(userId)
    query = query.where('parentId', '==', parsed.parentId ?? null)
    const siblingsSnap = await query.get()
    const order = siblingsSnap.size

    const now = new Date().toISOString()
    const docRef = this.todosCollection(userId).doc()
    const todoData: Omit<Todo, 'id'> = {
      title: parsed.title,
      completed: parsed.completed ?? false,
      dueDate: parsed.dueDate ?? null,
      startTime: parsed.startTime ?? null,
      endTime: parsed.endTime ?? null,
      parentId: parsed.parentId ?? null,
      order,
      depth,
      projectId: parsed.projectId ?? inheritedProjectId ?? null,
      priority: parsed.priority ?? null,
      categoryIcon: parsed.categoryIcon ?? null,
      description: parsed.description ?? null,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(todoData)

    return { id: docRef.id, ...todoData }
  }

  async updateTodo(
    userId: string,
    todoId: string,
    data: UpdateTodo
  ): Promise<Todo | null> {
    const docRef = this.todosCollection(userId).doc(todoId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as Todo
    const now = new Date().toISOString()

    const updateData: Partial<Todo> & { updatedAt: string } = {
      ...data,
      updatedAt: now,
    }

    await docRef.update(updateData)

    return { ...existing, ...updateData }
  }

  async deleteTodo(userId: string, todoId: string): Promise<number> {
    const docRef = this.todosCollection(userId).doc(todoId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return 0
    }

    // Collect all descendant IDs recursively
    const idsToDelete = await this.collectDescendantIds(userId, todoId)
    idsToDelete.push(todoId)

    // Batch delete
    const batch = this.db.batch()
    for (const id of idsToDelete) {
      batch.delete(this.todosCollection(userId).doc(id))
    }
    await batch.commit()

    return idsToDelete.length
  }

  private async collectDescendantIds(userId: string, parentId: string): Promise<string[]> {
    const query = this.todosCollection(userId).where('parentId', '==', parentId)
    const snapshot = await query.get()
    const ids: string[] = []

    for (const doc of snapshot.docs) {
      ids.push(doc.id)
      const childIds = await this.collectDescendantIds(userId, doc.id)
      ids.push(...childIds)
    }

    return ids
  }

  async toggleComplete(userId: string, todoId: string): Promise<Todo | null> {
    const docRef = this.todosCollection(userId).doc(todoId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const existing = { id: doc.id, ...doc.data() } as Todo
    const now = new Date().toISOString()
    const newCompleted = !existing.completed

    await docRef.update({ completed: newCompleted, updatedAt: now })

    return { ...existing, completed: newCompleted, updatedAt: now }
  }
}
