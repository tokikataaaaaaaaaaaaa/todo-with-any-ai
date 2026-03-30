import { create } from 'zustand'
import type { Todo, CreateTodo, UpdateTodo } from '@todo-with-any-ai/shared'
import { apiClient } from '@/lib/api-client'
import { useSnackbarStore } from '@/stores/snackbar-store'

interface TodoState {
  todos: Todo[]
  loading: boolean
  error: string | null
  expandedIds: Set<string>
  fetchTodos: (filters?: { sort?: string }) => Promise<void>
  createTodo: (data: CreateTodo) => Promise<void>
  updateTodo: (id: string, data: UpdateTodo) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  moveTodo: (todoId: string, targetId: string, position: 'child' | 'before' | 'after' | string) => Promise<void>
  toggleExpand: (id: string) => void
  reset: () => void
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  expandedIds: new Set<string>(),

  fetchTodos: async (filters?: { sort?: string }) => {
    set({ loading: true, error: null })
    try {
      const todos = await apiClient.listTodos(filters)
      set({ todos, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createTodo: async (data: CreateTodo) => {
    const prevTodos = get().todos
    // Optimistic: add a temporary todo
    const tempId = `temp-${Date.now()}`
    const tempTodo: Todo = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ todos: [...prevTodos, tempTodo], error: null })

    try {
      const serverTodo = await apiClient.createTodo(data)
      // Replace temp with server response
      set({
        todos: get().todos.map((t) => (t.id === tempId ? serverTodo : t)),
      })
      useSnackbarStore.getState().addMessage('success', 'Todoを作成しました')
    } catch (e) {
      // Rollback
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  updateTodo: async (id: string, data: UpdateTodo) => {
    const prevTodos = get().todos
    // Optimistic update
    set({
      todos: prevTodos.map((t) => (t.id === id ? { ...t, ...data } : t)),
      error: null,
    })

    try {
      const serverTodo = await apiClient.updateTodo(id, data)
      set({
        todos: get().todos.map((t) => (t.id === id ? serverTodo : t)),
      })
    } catch (e) {
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  deleteTodo: async (id: string) => {
    const prevTodos = get().todos
    // Optimistic remove
    set({ todos: prevTodos.filter((t) => t.id !== id), error: null })

    try {
      await apiClient.deleteTodo(id)
      useSnackbarStore.getState().addMessage('success', 'Todoを削除しました')
    } catch (e) {
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  toggleComplete: async (id: string) => {
    const prevTodos = get().todos
    // Optimistic toggle
    set({
      todos: prevTodos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
      error: null,
    })

    try {
      const serverTodo = await apiClient.toggleComplete(id)
      set({
        todos: get().todos.map((t) => (t.id === id ? serverTodo : t)),
      })
    } catch (e) {
      set({ todos: prevTodos, error: (e as Error).message })
      useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
    }
  },

  moveTodo: async (todoId: string, targetId: string, position: 'child' | 'before' | 'after' | string) => {
    console.log('[D&D] moveTodo called:', { todoId, targetId, position })
    const prevTodos = get().todos
    const movedTodo = prevTodos.find((t) => t.id === todoId)

    // Special case: drop onto project root drop zone
    if (targetId === 'root' && movedTodo) {
      const projectId = position || null // position carries the projectId
      const rootSiblings = prevTodos
        .filter((t) => t.parentId === null && t.projectId === projectId && t.id !== todoId)
        .sort((a, b) => a.order - b.order)
      const newOrder = rootSiblings.length

      const updateData: UpdateTodo = {
        parentId: null,
        depth: 0,
        order: newOrder,
        projectId: projectId,
      }

      set({
        todos: prevTodos.map((t) =>
          t.id === todoId ? { ...t, ...updateData } : t
        ),
        error: null,
      })

      try {
        const serverTodo = await apiClient.updateTodo(todoId, updateData)
        set({
          todos: get().todos.map((t) => (t.id === todoId ? serverTodo : t)),
        })
      } catch (e) {
        set({ todos: prevTodos, error: (e as Error).message })
        useSnackbarStore.getState().addMessage('error', '\u64CD\u4F5C\u306B\u5931\u6557\u3057\u307E\u3057\u305F')
      }
      return
    }

    const targetTodo = prevTodos.find((t) => t.id === targetId)
    if (!movedTodo || !targetTodo) {
      console.log('[D&D] moveTodo: todo not found', { movedTodo: !!movedTodo, targetTodo: !!targetTodo })
      return
    }

    if (position === 'child') {
      // Make movedTodo a child of targetTodo
      const existingChildren = prevTodos.filter((t) => t.parentId === targetId)
      const updateData: UpdateTodo = {
        parentId: targetId,
        depth: targetTodo.depth + 1,
        order: existingChildren.length,
        projectId: movedTodo.projectId || targetTodo.projectId,
      }

      // Optimistic update
      set({
        todos: prevTodos.map((t) =>
          t.id === todoId ? { ...t, ...updateData } : t
        ),
        error: null,
      })

      try {
        const serverTodo = await apiClient.updateTodo(todoId, updateData)
        set({
          todos: get().todos.map((t) => (t.id === todoId ? serverTodo : t)),
        })
      } catch (e) {
        set({ todos: prevTodos, error: (e as Error).message })
        useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
      }
    } else {
      // before or after: reorder within the same parent
      const newParentId = targetTodo.parentId
      const siblings = prevTodos
        .filter((t) => t.parentId === newParentId && t.id !== todoId)
        .sort((a, b) => a.order - b.order)

      const targetIndex = siblings.findIndex((t) => t.id === targetId)
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1

      // Build new ordered list with movedTodo inserted at the right position
      const newSiblingOrder = [...siblings]
      newSiblingOrder.splice(insertIndex, 0, movedTodo)

      // Calculate updates for all siblings that need new order values
      const siblingUpdates: { id: string; order: number }[] = []
      for (let i = 0; i < newSiblingOrder.length; i++) {
        const sibling = newSiblingOrder[i]
        if (sibling.order !== i || sibling.id === todoId) {
          siblingUpdates.push({ id: sibling.id, order: i })
        }
      }

      console.log('[D&D] siblingUpdates:', siblingUpdates)

      // Optimistic update: update all siblings' orders + moved todo's parentId/depth
      set({
        todos: prevTodos.map((t) => {
          const update = siblingUpdates.find((u) => u.id === t.id)
          if (t.id === todoId) {
            return {
              ...t,
              parentId: newParentId,
              depth: targetTodo.depth,
              order: update?.order ?? t.order,
              projectId: t.projectId || targetTodo.projectId,
            }
          }
          if (update) {
            return { ...t, order: update.order }
          }
          return t
        }),
        error: null,
      })

      try {
        // Send API updates for all changed siblings
        await Promise.all(
          siblingUpdates.map((update) => {
            const data: UpdateTodo =
              update.id === todoId
                ? { parentId: newParentId, depth: targetTodo.depth, order: update.order, projectId: movedTodo.projectId || targetTodo.projectId }
                : { order: update.order }
            return apiClient.updateTodo(update.id, data)
          })
        )
      } catch (e) {
        set({ todos: prevTodos, error: (e as Error).message })
        useSnackbarStore.getState().addMessage('error', '操作に失敗しました')
      }
    }
  },

  toggleExpand: (id: string) => {
    const expandedIds = new Set(get().expandedIds)
    if (expandedIds.has(id)) {
      expandedIds.delete(id)
    } else {
      expandedIds.add(id)
    }
    set({ expandedIds })
  },

  reset: () => {
    set({
      todos: [],
      loading: false,
      error: null,
      expandedIds: new Set<string>(),
    })
  },
}))
