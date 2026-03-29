import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Project } from '@todo-with-any-ai/shared'

// Mock stores
const mockCreateTodo = vi.fn()
const mockFetchProjects = vi.fn()

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
      fetchProjects: mockFetchProjects,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import { TodoCreateForm } from '@/components/todo/todo-create-form'

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Work',
  color: '#6366F1',
  emoji: '💼',
  order: 0,
  dueDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('TodoCreateForm - project selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = []
  })

  it('should render project select dropdown', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    const select = screen.getByLabelText('プロジェクト')
    expect(select).toBeInTheDocument()
  })

  it('should have "未分類" as default option', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(screen.getByText('未分類')).toBeInTheDocument()
  })

  it('should show project options when projects are available', () => {
    mockProjects = [
      makeProject({ id: 'p1', name: 'Work', emoji: '💼' }),
      makeProject({ id: 'p2', name: 'Personal', emoji: '🏠' }),
    ]
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    expect(screen.getByText('💼 Work')).toBeInTheDocument()
    expect(screen.getByText('🏠 Personal')).toBeInTheDocument()
  })

  it('should include projectId in createTodo when project is selected', async () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work' })]
    mockCreateTodo.mockResolvedValueOnce(undefined)

    render(<TodoCreateForm />)

    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'Test task' } })

    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    const select = screen.getByLabelText('プロジェクト')
    fireEvent.change(select, { target: { value: 'p1' } })

    const submitButton = screen.getByLabelText('Create todo')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test task',
          projectId: 'p1',
        })
      )
    })
  })

  it('should send projectId as null when "未分類" is selected', async () => {
    mockCreateTodo.mockResolvedValueOnce(undefined)

    render(<TodoCreateForm />)

    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'Uncategorized task' } })

    const submitButton = screen.getByLabelText('Create todo')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: null,
        })
      )
    })
  })

  it('should include urgencyLevelId as null in createTodo call', async () => {
    mockCreateTodo.mockResolvedValueOnce(undefined)

    render(<TodoCreateForm />)

    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'Test' } })

    const submitButton = screen.getByLabelText('Create todo')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          urgencyLevelId: null,
        })
      )
    })
  })

  it('should reset project selection after successful create', async () => {
    mockProjects = [makeProject({ id: 'p1', name: 'Work' })]
    mockCreateTodo.mockResolvedValueOnce(undefined)

    render(<TodoCreateForm />)

    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'Test' } })

    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'p1' } })

    const submitButton = screen.getByLabelText('Create todo')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(select.value).toBe('')
    })
  })
})
