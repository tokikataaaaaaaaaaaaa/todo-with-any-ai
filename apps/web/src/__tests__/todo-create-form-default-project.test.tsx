import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Project } from '@todo-with-any-ai/shared'

// Mock stores
const mockCreateTodo = vi.fn()

let mockProjects: Project[] = []

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = {
      createTodo: mockCreateTodo,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: mockProjects,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: vi.fn((selector) => {
    const state = {
      filterType: 'all',
      projectId: null,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import { TodoCreateForm } from '@/components/todo/todo-create-form'

describe('TodoCreateForm - defaultProjectId persistence after submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = [
      {
        id: 'p1',
        name: 'Work',
        color: '#6366F1',
        emoji: '\u{1F4BC}',
        order: 0,
        dueDate: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]
    mockCreateTodo.mockResolvedValue(undefined)
  })

  it('should keep defaultProjectId after form submission', async () => {
    render(<TodoCreateForm defaultProjectId="p1" compact />)

    // Submit a todo
    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'First task' } })
    const submitButton = screen.getByLabelText('Create todo')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'First task',
          projectId: 'p1',
        })
      )
    })

    // Submit another todo - should still use p1
    fireEvent.change(titleInput, { target: { value: 'Second task' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledTimes(2)
      expect(mockCreateTodo).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Second task',
          projectId: 'p1',
        })
      )
    })
  })
})
