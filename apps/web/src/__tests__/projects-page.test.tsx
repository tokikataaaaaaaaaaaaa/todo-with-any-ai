import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Project } from '@todo-with-any-ai/shared'

// Mock project store
const mockFetchProjects = vi.fn()
const mockCreateProject = vi.fn()
const mockUpdateProject = vi.fn()
const mockDeleteProject = vi.fn()

let mockStoreState = {
  projects: [] as Project[],
  loading: false,
  error: null as string | null,
  fetchProjects: mockFetchProjects,
  createProject: mockCreateProject,
  updateProject: mockUpdateProject,
  deleteProject: mockDeleteProject,
  reset: vi.fn(),
}

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    return typeof selector === 'function' ? selector(mockStoreState) : mockStoreState
  }),
}))

// Need to import after mock
import ProjectsPage from '@/app/(app)/projects/page'

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

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState = {
      projects: [],
      loading: false,
      error: null,
      fetchProjects: mockFetchProjects,
      createProject: mockCreateProject,
      updateProject: mockUpdateProject,
      deleteProject: mockDeleteProject,
      reset: vi.fn(),
    }
  })

  it('should render page title', () => {
    render(<ProjectsPage />)
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('should call fetchProjects on mount', () => {
    render(<ProjectsPage />)
    expect(mockFetchProjects).toHaveBeenCalled()
  })

  it('should show loading skeleton when loading', () => {
    mockStoreState.loading = true
    render(<ProjectsPage />)
    expect(screen.getByTestId('project-skeleton')).toBeInTheDocument()
  })

  it('should show error message when there is an error', () => {
    mockStoreState.error = 'Failed to load projects'
    render(<ProjectsPage />)
    expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
  })

  it('should show empty state when no projects exist', () => {
    render(<ProjectsPage />)
    expect(screen.getByText(/プロジェクトがありません/)).toBeInTheDocument()
  })

  it('should render project list with emoji and color badge', () => {
    mockStoreState.projects = [
      makeProject({ id: 'p1', name: 'Work', emoji: '💼', color: '#6366F1' }),
      makeProject({ id: 'p2', name: 'Personal', emoji: '🏠', color: '#E11D48' }),
    ]
    render(<ProjectsPage />)
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('💼')).toBeInTheDocument()
    expect(screen.getByText('🏠')).toBeInTheDocument()
  })

  it('should open create dialog when clicking new project button', async () => {
    render(<ProjectsPage />)
    const addButton = screen.getByLabelText('新規プロジェクト')
    fireEvent.click(addButton)
    expect(screen.getByText('プロジェクト作成')).toBeInTheDocument()
  })

  it('should show 8 color options in create dialog', async () => {
    render(<ProjectsPage />)
    const addButton = screen.getByLabelText('新規プロジェクト')
    fireEvent.click(addButton)
    const colorButtons = screen.getAllByTestId(/^color-option-/)
    expect(colorButtons).toHaveLength(8)
  })

  it('should show emoji preset options in create dialog', async () => {
    render(<ProjectsPage />)
    const addButton = screen.getByLabelText('新規プロジェクト')
    fireEvent.click(addButton)
    const emojiButtons = screen.getAllByTestId(/^emoji-option-/)
    expect(emojiButtons.length).toBeGreaterThanOrEqual(20)
  })

  it('should call createProject with form data when submitting', async () => {
    mockCreateProject.mockResolvedValueOnce(undefined)
    render(<ProjectsPage />)

    const addButton = screen.getByLabelText('新規プロジェクト')
    fireEvent.click(addButton)

    const nameInput = screen.getByPlaceholderText('プロジェクト名')
    fireEvent.change(nameInput, { target: { value: 'New Project' } })

    // Select a color
    const colorOption = screen.getByTestId('color-option-#E11D48')
    fireEvent.click(colorOption)

    // Select an emoji
    const emojiOption = screen.getByTestId('emoji-option-🏠')
    fireEvent.click(emojiOption)

    const submitButton = screen.getByText('作成')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: 'New Project',
        color: '#E11D48',
        emoji: '🏠',
        dueDate: null,
      })
    })
  })

  it('should not submit create form when name is empty', async () => {
    render(<ProjectsPage />)

    const addButton = screen.getByLabelText('新規プロジェクト')
    fireEvent.click(addButton)

    const submitButton = screen.getByText('作成')
    fireEvent.click(submitButton)

    expect(mockCreateProject).not.toHaveBeenCalled()
  })

  it('should open edit dialog when clicking a project edit button', async () => {
    mockStoreState.projects = [makeProject({ id: 'p1', name: 'Work' })]
    render(<ProjectsPage />)

    const editButton = screen.getByTestId('edit-project-p1')
    fireEvent.click(editButton)

    expect(screen.getByText('プロジェクト編集')).toBeInTheDocument()
  })

  it('should pre-fill edit dialog with project data', async () => {
    mockStoreState.projects = [makeProject({ id: 'p1', name: 'Work', color: '#6366F1', emoji: '💼' })]
    render(<ProjectsPage />)

    const editButton = screen.getByTestId('edit-project-p1')
    fireEvent.click(editButton)

    const nameInput = screen.getByDisplayValue('Work')
    expect(nameInput).toBeInTheDocument()
  })

  it('should call updateProject when saving edit', async () => {
    mockUpdateProject.mockResolvedValueOnce(undefined)
    mockStoreState.projects = [makeProject({ id: 'p1', name: 'Work' })]
    render(<ProjectsPage />)

    const editButton = screen.getByTestId('edit-project-p1')
    fireEvent.click(editButton)

    const nameInput = screen.getByDisplayValue('Work')
    fireEvent.change(nameInput, { target: { value: 'Updated Work' } })

    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith('p1', expect.objectContaining({
        name: 'Updated Work',
      }))
    })
  })

  it('should call deleteProject when confirming delete', async () => {
    mockDeleteProject.mockResolvedValueOnce(undefined)
    mockStoreState.projects = [makeProject({ id: 'p1', name: 'Work' })]
    render(<ProjectsPage />)

    const editButton = screen.getByTestId('edit-project-p1')
    fireEvent.click(editButton)

    const deleteButton = screen.getByText('削除')
    fireEvent.click(deleteButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith('p1')
    })
  })

  it('should close create dialog when clicking cancel', async () => {
    render(<ProjectsPage />)
    const addButton = screen.getByLabelText('新規プロジェクト')
    fireEvent.click(addButton)
    expect(screen.getByText('プロジェクト作成')).toBeInTheDocument()

    const cancelButton = screen.getByText('キャンセル')
    fireEvent.click(cancelButton)
    expect(screen.queryByText('プロジェクト作成')).not.toBeInTheDocument()
  })
})
