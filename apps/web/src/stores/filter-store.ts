import { create } from 'zustand'

export type FilterType = 'all' | 'today' | 'upcoming' | 'project'

interface FilterState {
  filterType: FilterType
  projectId: string | null
  setFilter: (type: FilterType, projectId?: string) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  filterType: 'all',
  projectId: null,

  setFilter: (type: FilterType, projectId?: string) => {
    set({
      filterType: type,
      projectId: type === 'project' ? (projectId ?? null) : null,
    })
  },
}))
