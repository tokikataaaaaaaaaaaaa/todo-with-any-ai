import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import type { Project } from '@todo-with-any-ai/shared'

// Mock stores
const mockCreateTodo = vi.fn().mockResolvedValue(undefined)
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

describe('TodoCreateForm - details toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = [makeProject()]
  })

  it('should not show details section by default', () => {
    render(<TodoCreateForm />)
    expect(screen.queryByLabelText('期限')).not.toBeInTheDocument()
    expect(screen.queryByText('高')).not.toBeInTheDocument()
  })

  it('should show details section when toggle is clicked', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    expect(screen.getByLabelText('期限')).toBeInTheDocument()
  })

  it('should hide details section when toggle is clicked again', () => {
    render(<TodoCreateForm />)
    const toggleBtn = screen.getByRole('button', { name: /詳細設定/ })
    fireEvent.click(toggleBtn)
    expect(screen.getByLabelText('期限')).toBeInTheDocument()
    fireEvent.click(toggleBtn)
    expect(screen.queryByLabelText('期限')).not.toBeInTheDocument()
  })
})

describe('TodoCreateForm - due date', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = []
  })

  it('should allow setting a due date', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const dateInput = screen.getByLabelText('期限')
    fireEvent.change(dateInput, { target: { value: '2026-06-15' } })
    expect(dateInput).toHaveValue('2026-06-15')
  })

  it('should clear due date when clear button is clicked', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const dateInput = screen.getByLabelText('期限')
    fireEvent.change(dateInput, { target: { value: '2026-06-15' } })
    expect(dateInput).toHaveValue('2026-06-15')

    fireEvent.click(screen.getByRole('button', { name: /期限クリア/ }))
    expect(dateInput).toHaveValue('')
  })
})

describe('TodoCreateForm - priority', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = []
  })

  it('should default to no priority selected', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const noneBtn = screen.getByRole('button', { name: 'なし' })
    expect(noneBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('should allow selecting high priority', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const highBtn = screen.getByRole('button', { name: '高' })
    fireEvent.click(highBtn)
    expect(highBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('should allow selecting medium priority', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    fireEvent.click(screen.getByRole('button', { name: '中' }))
    expect(screen.getByRole('button', { name: '中' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('should allow selecting low priority', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    fireEvent.click(screen.getByRole('button', { name: '低' }))
    expect(screen.getByRole('button', { name: '低' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('should deselect priority when clicking the same button again (back to none)', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const highBtn = screen.getByRole('button', { name: '高' })
    fireEvent.click(highBtn)
    expect(highBtn).toHaveAttribute('aria-pressed', 'true')

    // Click again to deselect
    fireEvent.click(highBtn)
    expect(highBtn).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'なし' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('TodoCreateForm - category icon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = []
  })

  it('should show 6 category icon chips when details are expanded', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const categories = ['work', 'personal', 'shopping', 'health', 'study', 'idea']
    for (const cat of categories) {
      expect(screen.getByRole('button', { name: cat })).toBeInTheDocument()
    }
  })

  it('should allow selecting a category icon', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const workBtn = screen.getByRole('button', { name: 'work' })
    fireEvent.click(workBtn)
    expect(workBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('should deselect category when clicking the same icon again', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const workBtn = screen.getByRole('button', { name: 'work' })
    fireEvent.click(workBtn)
    expect(workBtn).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(workBtn)
    expect(workBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('should allow switching between category icons', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const workBtn = screen.getByRole('button', { name: 'work' })
    const healthBtn = screen.getByRole('button', { name: 'health' })

    fireEvent.click(workBtn)
    expect(workBtn).toHaveAttribute('aria-pressed', 'true')
    expect(healthBtn).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(healthBtn)
    expect(healthBtn).toHaveAttribute('aria-pressed', 'true')
    expect(workBtn).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('TodoCreateForm - submit with all attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = [makeProject({ id: 'proj-1', name: 'Work', emoji: '💼' })]
  })

  it('should call createTodo with all attributes when submitted', async () => {
    render(<TodoCreateForm />)

    // Fill title
    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'Full attribute todo' } })

    // Expand details
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    // Set due date
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-07-01' } })

    // Set priority to high
    fireEvent.click(screen.getByRole('button', { name: '高' }))

    // Set category to work
    fireEvent.click(screen.getByRole('button', { name: 'work' }))

    // Select project
    fireEvent.change(screen.getByLabelText('プロジェクト'), { target: { value: 'proj-1' } })

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Create todo'))
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith({
        title: 'Full attribute todo',
        completed: false,
        parentId: null,
        order: 0,
        depth: 0,
        description: null,
        dueDate: '2026-07-01',
        startTime: null,
        endTime: null,
        priority: 'high',
        categoryIcon: 'work',
        projectId: 'proj-1',
        urgencyLevelId: null,
      })
    })
  })

  it('should call createTodo with null for unset optional attributes', async () => {
    render(<TodoCreateForm />)

    const titleInput = screen.getByLabelText('New todo title')
    fireEvent.change(titleInput, { target: { value: 'Simple todo' } })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Create todo'))
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith({
        title: 'Simple todo',
        completed: false,
        parentId: null,
        order: 0,
        depth: 0,
        dueDate: null,
        startTime: null,
        endTime: null,
        priority: null,
        categoryIcon: null,
  description: null,
        projectId: null,
        urgencyLevelId: null,
      })
    })
  })

  it('should reset all fields after successful submission', async () => {
    render(<TodoCreateForm />)

    // Fill title
    fireEvent.change(screen.getByLabelText('New todo title'), { target: { value: 'Reset test' } })

    // Expand details and set values
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-07-01' } })
    fireEvent.click(screen.getByRole('button', { name: '高' }))
    fireEvent.click(screen.getByRole('button', { name: 'work' }))

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Create todo'))
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalled()
    })

    // Title should be cleared
    expect(screen.getByLabelText('New todo title')).toHaveValue('')

    // Due date should be cleared
    expect(screen.getByLabelText('期限')).toHaveValue('')
    // Priority should be back to none
    expect(screen.getByRole('button', { name: 'なし' })).toHaveAttribute('aria-pressed', 'true')
    // Category should be deselected
    expect(screen.getByRole('button', { name: 'work' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('TodoCreateForm - project select in details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = [
      makeProject({ id: 'p1', name: 'Work', emoji: '💼' }),
      makeProject({ id: 'p2', name: 'Personal', emoji: '🏠' }),
    ]
  })

  it('should show project options in the select', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    const select = screen.getByLabelText('プロジェクト')
    expect(select).toBeInTheDocument()

    const options = select.querySelectorAll('option')
    expect(options).toHaveLength(3) // 未分類 + 2 projects
  })
})
