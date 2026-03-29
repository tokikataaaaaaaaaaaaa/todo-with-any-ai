import { create } from 'zustand'
import type { Project, CreateProject, UpdateProject } from '@todo-with-any-ai/shared'
import { apiClient } from '@/lib/api-client'

interface ProjectState {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProject) => Promise<void>
  updateProject: (id: string, data: UpdateProject) => Promise<void>
  deleteProject: (id: string, deleteTodos?: boolean) => Promise<void>
  reset: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await apiClient.listProjects()
      set({ projects, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createProject: async (data: CreateProject) => {
    const prevProjects = get().projects
    const tempId = `temp-${Date.now()}`
    const tempProject: Project = {
      ...data,
      id: tempId,
      order: prevProjects.length,
      dueDate: data.dueDate ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ projects: [...prevProjects, tempProject], error: null })

    try {
      const serverProject = await apiClient.createProject(data)
      set({
        projects: get().projects.map((p) => (p.id === tempId ? serverProject : p)),
      })
    } catch (e) {
      set({ projects: prevProjects, error: (e as Error).message })
    }
  },

  updateProject: async (id: string, data: UpdateProject) => {
    const prevProjects = get().projects
    set({
      projects: prevProjects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      error: null,
    })

    try {
      const serverProject = await apiClient.updateProject(id, data)
      set({
        projects: get().projects.map((p) => (p.id === id ? serverProject : p)),
      })
    } catch (e) {
      set({ projects: prevProjects, error: (e as Error).message })
    }
  },

  deleteProject: async (id: string, deleteTodos?: boolean) => {
    const prevProjects = get().projects
    set({ projects: prevProjects.filter((p) => p.id !== id), error: null })

    try {
      await apiClient.deleteProject(id, deleteTodos)
    } catch (e) {
      set({ projects: prevProjects, error: (e as Error).message })
    }
  },

  reset: () => {
    set({
      projects: [],
      loading: false,
      error: null,
    })
  },
}))
