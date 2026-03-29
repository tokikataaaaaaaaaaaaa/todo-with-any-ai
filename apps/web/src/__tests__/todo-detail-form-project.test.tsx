import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { Todo, Project, UrgencyLevel } from '@todo-with-any-ai/shared'

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Work',
    color: '#6366F1',
    emoji: '\u{1F4BC}',
    order: 0,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Personal',
    color: '#E11D48',
    emoji: '\u{1F3E0}',
    order: 1,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockUrgencyLevels: UrgencyLevel[] = []

const baseTodo: Todo = {
  id: 'todo-1',
  title: 'Test Todo',
  completed: false,
  dueDate: null,
  parentId: null,
  order: 0,
  depth: 0,
  priority: null,
  categoryIcon: null,
  projectId: null,
  urgencyLevelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const allTodos: Todo[] = [baseTodo]

describe('TodoDetailForm - Project Selector', () => {
  const mockOnSave = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderForm(todoOverrides?: Partial<Todo>, projects?: Project[]) {
    const todo = { ...baseTodo, ...todoOverrides }
    return render(
      <TodoDetailForm
        todo={todo}
        allTodos={allTodos}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        urgencyLevels={mockUrgencyLevels}
        projects={projects ?? mockProjects}
      />
    )
  }

  it('should render project selector label', () => {
    renderForm()
    expect(screen.getByText('プロジェクト')).toBeInTheDocument()
  })

  it('should render a select element for projects', () => {
    renderForm()
    const select = screen.getByLabelText('プロジェクト')
    expect(select).toBeInTheDocument()
    expect(select.tagName).toBe('SELECT')
  })

  it('should include "未分類" option for no project', () => {
    renderForm()
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    const options = Array.from(select.options)
    expect(options.some((o) => o.text === '未分類')).toBe(true)
  })

  it('should render all project options with emoji + name', () => {
    renderForm()
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    const options = Array.from(select.options)
    expect(options.some((o) => o.text.includes('Work'))).toBe(true)
    expect(options.some((o) => o.text.includes('Personal'))).toBe(true)
  })

  it('should select the current projectId', () => {
    renderForm({ projectId: 'proj-2' })
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    expect(select.value).toBe('proj-2')
  })

  it('should select "未分類" when projectId is null', () => {
    renderForm({ projectId: null })
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('should change projectId on selection', () => {
    renderForm()
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'proj-1' } })
    expect(select.value).toBe('proj-1')
  })

  it('should include projectId in save data', () => {
    renderForm({ projectId: null })
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'proj-1' } })

    const saveButton = screen.getByText('保存する')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'proj-1' })
    )
  })

  it('should send null projectId when "未分類" is selected', () => {
    renderForm({ projectId: 'proj-1' })
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '' } })

    const saveButton = screen.getByText('保存する')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: null })
    )
  })

  it('should render empty projects list gracefully', () => {
    renderForm({}, [])
    const select = screen.getByLabelText('プロジェクト') as HTMLSelectElement
    const options = Array.from(select.options)
    expect(options).toHaveLength(1) // Only "未分類"
  })
})
