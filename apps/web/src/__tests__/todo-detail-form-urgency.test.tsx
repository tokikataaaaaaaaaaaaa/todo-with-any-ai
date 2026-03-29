import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { Todo, UrgencyLevel } from '@todo-with-any-ai/shared'

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

describe('TodoDetailForm - Urgency Selector', () => {
  const mockOnSave = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderForm(todoOverrides?: Partial<Todo>, levels?: UrgencyLevel[]) {
    const todo = { ...baseTodo, ...todoOverrides }
    return render(
      <TodoDetailForm
        todo={todo}
        allTodos={allTodos}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        urgencyLevels={levels ?? mockLevels}
      />
    )
  }

  it('should render urgency level label', () => {
    renderForm()
    expect(screen.getByText('緊急度')).toBeInTheDocument()
  })

  it('should render a select element with urgency levels', () => {
    renderForm()
    const select = screen.getByLabelText('緊急度')
    expect(select).toBeInTheDocument()
    expect(select.tagName).toBe('SELECT')
  })

  it('should include a "なし" option for no urgency', () => {
    renderForm()
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    const options = Array.from(select.options)
    expect(options.some((o) => o.text === 'なし')).toBe(true)
  })

  it('should render all urgency level options with icon + name', () => {
    renderForm()
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    const options = Array.from(select.options)
    expect(options.some((o) => o.text.includes('Low'))).toBe(true)
    expect(options.some((o) => o.text.includes('Medium'))).toBe(true)
    expect(options.some((o) => o.text.includes('High'))).toBe(true)
  })

  it('should select the current urgencyLevelId', () => {
    renderForm({ urgencyLevelId: 'ul-2' })
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    expect(select.value).toBe('ul-2')
  })

  it('should select "なし" when urgencyLevelId is null', () => {
    renderForm({ urgencyLevelId: null })
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('should change urgencyLevelId on selection', () => {
    renderForm()
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'ul-3' } })
    expect(select.value).toBe('ul-3')
  })

  it('should include urgencyLevelId in save data', () => {
    renderForm({ urgencyLevelId: null })
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'ul-1' } })

    const saveButton = screen.getByText('保存する')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ urgencyLevelId: 'ul-1' })
    )
  })

  it('should send null urgencyLevelId when "なし" is selected', () => {
    renderForm({ urgencyLevelId: 'ul-2' })
    const select = screen.getByLabelText('緊急度') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '' } })

    const saveButton = screen.getByText('保存する')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ urgencyLevelId: null })
    )
  })

  it('should not render old priority segment control', () => {
    renderForm()
    // The old priority labels should be gone
    expect(screen.queryByText('優先度')).not.toBeInTheDocument()
  })
})
