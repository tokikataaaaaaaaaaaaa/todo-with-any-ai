import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore } from '@/stores/filter-store'

describe('filter-store', () => {
  beforeEach(() => {
    useFilterStore.setState({
      filterType: 'all',
      projectId: null,
    })
  })

  it('should have default state: filterType=all, projectId=null', () => {
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('all')
    expect(state.projectId).toBeNull()
  })

  it('should set filter to today', () => {
    useFilterStore.getState().setFilter('today')
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('today')
    expect(state.projectId).toBeNull()
  })

  it('should set filter to upcoming', () => {
    useFilterStore.getState().setFilter('upcoming')
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('upcoming')
    expect(state.projectId).toBeNull()
  })

  it('should set filter to project with projectId', () => {
    useFilterStore.getState().setFilter('project', 'proj-123')
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('project')
    expect(state.projectId).toBe('proj-123')
  })

  it('should clear projectId when switching from project to all', () => {
    useFilterStore.getState().setFilter('project', 'proj-123')
    useFilterStore.getState().setFilter('all')
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('all')
    expect(state.projectId).toBeNull()
  })

  it('should clear projectId when switching from project to today', () => {
    useFilterStore.getState().setFilter('project', 'proj-123')
    useFilterStore.getState().setFilter('today')
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('today')
    expect(state.projectId).toBeNull()
  })

  it('should update projectId when switching between projects', () => {
    useFilterStore.getState().setFilter('project', 'proj-1')
    useFilterStore.getState().setFilter('project', 'proj-2')
    const state = useFilterStore.getState()
    expect(state.filterType).toBe('project')
    expect(state.projectId).toBe('proj-2')
  })
})
