import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUrgencyLevelStore } from '@/stores/urgency-level-store'
import type { UrgencyLevel } from '@todo-with-any-ai/shared'

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    listUrgencyLevels: vi.fn(),
    createUrgencyLevel: vi.fn(),
    updateUrgencyLevel: vi.fn(),
    deleteUrgencyLevel: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'

const mockLevels: UrgencyLevel[] = [
  {
    id: 'ul-1',
    name: 'Low',
    color: '#22C55E',
    icon: '🟢',
    order: 0,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ul-2',
    name: 'Medium',
    color: '#F59E0B',
    icon: '🟡',
    order: 1,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ul-3',
    name: 'High',
    color: '#EF4444',
    icon: '🔴',
    order: 2,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

describe('useUrgencyLevelStore', () => {
  beforeEach(() => {
    useUrgencyLevelStore.setState({
      levels: [],
      loading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('fetchLevels', () => {
    it('should set loading to true while fetching', async () => {
      vi.mocked(apiClient.listUrgencyLevels).mockImplementation(
        () => new Promise(() => {}) // never resolves
      )

      useUrgencyLevelStore.getState().fetchLevels()

      expect(useUrgencyLevelStore.getState().loading).toBe(true)
    })

    it('should populate levels on successful fetch', async () => {
      vi.mocked(apiClient.listUrgencyLevels).mockResolvedValue(mockLevels)

      await useUrgencyLevelStore.getState().fetchLevels()

      const state = useUrgencyLevelStore.getState()
      expect(state.levels).toEqual(mockLevels)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set error on fetch failure', async () => {
      vi.mocked(apiClient.listUrgencyLevels).mockRejectedValue(
        new Error('Network error')
      )

      await useUrgencyLevelStore.getState().fetchLevels()

      const state = useUrgencyLevelStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.loading).toBe(false)
      expect(state.levels).toEqual([])
    })

    it('should clear previous error on new fetch', async () => {
      useUrgencyLevelStore.setState({ error: 'Previous error' })
      vi.mocked(apiClient.listUrgencyLevels).mockResolvedValue(mockLevels)

      await useUrgencyLevelStore.getState().fetchLevels()

      expect(useUrgencyLevelStore.getState().error).toBeNull()
    })

    it('should call listUrgencyLevels from apiClient', async () => {
      vi.mocked(apiClient.listUrgencyLevels).mockResolvedValue([])

      await useUrgencyLevelStore.getState().fetchLevels()

      expect(apiClient.listUrgencyLevels).toHaveBeenCalledTimes(1)
    })
  })

  describe('createLevel', () => {
    it('should add the new level to the store', async () => {
      const newLevel: UrgencyLevel = {
        id: 'ul-new',
        name: 'Custom',
        color: '#8B5CF6',
        icon: '🟣',
        order: 3,
        isDefault: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }
      vi.mocked(apiClient.createUrgencyLevel).mockResolvedValue(newLevel)

      await useUrgencyLevelStore.getState().createLevel({
        name: 'Custom',
        color: '#8B5CF6',
        icon: '🟣',
      })

      expect(useUrgencyLevelStore.getState().levels).toContainEqual(newLevel)
    })

    it('should set error on create failure', async () => {
      vi.mocked(apiClient.createUrgencyLevel).mockRejectedValue(
        new Error('Create failed')
      )

      await useUrgencyLevelStore.getState().createLevel({
        name: 'Fail',
        color: '#000000',
        icon: 'X',
      })

      expect(useUrgencyLevelStore.getState().error).toBe('Create failed')
    })
  })

  describe('updateLevel', () => {
    it('should update level in place', async () => {
      useUrgencyLevelStore.setState({ levels: [...mockLevels] })
      const updated = { ...mockLevels[0], name: 'Very Low' }
      vi.mocked(apiClient.updateUrgencyLevel).mockResolvedValue(updated)

      await useUrgencyLevelStore.getState().updateLevel('ul-1', { name: 'Very Low' })

      const level = useUrgencyLevelStore.getState().levels.find((l) => l.id === 'ul-1')
      expect(level?.name).toBe('Very Low')
    })

    it('should set error on update failure', async () => {
      useUrgencyLevelStore.setState({ levels: [...mockLevels] })
      vi.mocked(apiClient.updateUrgencyLevel).mockRejectedValue(
        new Error('Update failed')
      )

      await useUrgencyLevelStore.getState().updateLevel('ul-1', { name: 'Fail' })

      expect(useUrgencyLevelStore.getState().error).toBe('Update failed')
    })
  })

  describe('deleteLevel', () => {
    it('should remove the level from the store', async () => {
      useUrgencyLevelStore.setState({ levels: [...mockLevels] })
      vi.mocked(apiClient.deleteUrgencyLevel).mockResolvedValue(undefined)

      await useUrgencyLevelStore.getState().deleteLevel('ul-3')

      const ids = useUrgencyLevelStore.getState().levels.map((l) => l.id)
      expect(ids).not.toContain('ul-3')
    })

    it('should rollback on delete failure', async () => {
      useUrgencyLevelStore.setState({ levels: [...mockLevels] })
      vi.mocked(apiClient.deleteUrgencyLevel).mockRejectedValue(
        new Error('Delete failed')
      )

      await useUrgencyLevelStore.getState().deleteLevel('ul-3')

      const ids = useUrgencyLevelStore.getState().levels.map((l) => l.id)
      expect(ids).toContain('ul-3')
      expect(useUrgencyLevelStore.getState().error).toBe('Delete failed')
    })
  })

  describe('reset', () => {
    it('should reset the store to initial state', () => {
      useUrgencyLevelStore.setState({
        levels: mockLevels,
        loading: true,
        error: 'some error',
      })

      useUrgencyLevelStore.getState().reset()

      const state = useUrgencyLevelStore.getState()
      expect(state.levels).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
