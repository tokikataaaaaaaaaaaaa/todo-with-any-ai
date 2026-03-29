import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { Todo } from '@todo-with-any-ai/shared'

// We need userEvent for type interactions
vi.mock('@testing-library/user-event', async () => {
  const actual = await vi.importActual('@testing-library/user-event')
  return actual
})

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

const allTodos: Todo[] = [
  baseTodo,
  { ...baseTodo, id: 'todo-2', title: 'Parent Todo' },
  { ...baseTodo, id: 'todo-3', title: 'Another Todo' },
]

describe('TodoDetailForm', () => {
  const mockOnSave = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
    mockOnDelete.mockResolvedValue(undefined)
  })

  function renderForm(todoOverrides?: Partial<Todo>) {
    const todo = { ...baseTodo, ...todoOverrides }
    return render(
      <TodoDetailForm
        todo={todo}
        allTodos={allTodos}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    )
  }

  describe('title display and editing', () => {
    it('should display the todo title in input', () => {
      renderForm()
      const input = screen.getByDisplayValue('Test Todo')
      expect(input).toBeInTheDocument()
    })

    it('should allow editing the title', async () => {
      renderForm()
      const input = screen.getByDisplayValue('Test Todo')
      fireEvent.change(input, { target: { value: 'Updated Title' } })
      expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument()
    })
  })

  describe('urgency selector (replaced priority)', () => {
    it('should render urgency label instead of priority', () => {
      renderForm()
      expect(screen.getByText('緊急度')).toBeInTheDocument()
      // Old priority selector should not be present
      expect(screen.queryByText('優先度')).not.toBeInTheDocument()
    })

    it('should render urgency select element', () => {
      renderForm()
      const select = screen.getByLabelText('緊急度')
      expect(select).toBeInTheDocument()
      expect(select.tagName).toBe('SELECT')
    })

    it('should have "なし" as default urgency option', () => {
      renderForm()
      const select = screen.getByLabelText('緊急度') as HTMLSelectElement
      const options = Array.from(select.options)
      expect(options.some((o) => o.text === 'なし')).toBe(true)
    })
  })

  describe('category chip selector', () => {
    it('should render all category chips', () => {
      renderForm()
      expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shopping/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /health/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /study/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /idea/i })).toBeInTheDocument()
    })

    it('should highlight selected category', () => {
      renderForm({ categoryIcon: 'work' })
      const workChip = screen.getByRole('button', { name: /work/i })
      expect(workChip).toHaveAttribute('data-selected', 'true')
    })

    it('should allow toggling category off', () => {
      renderForm({ categoryIcon: 'work' })
      const workChip = screen.getByRole('button', { name: /work/i })
      fireEvent.click(workChip)
      expect(workChip).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('due date', () => {
    it('should display due date when set', () => {
      renderForm({ dueDate: '2026-03-15' })
      const input = screen.getByDisplayValue('2026-03-15')
      expect(input).toBeInTheDocument()
    })

    it('should show clear button when due date is set', () => {
      renderForm({ dueDate: '2026-03-15' })
      expect(screen.getByRole('button', { name: /クリア/i })).toBeInTheDocument()
    })

    it('should clear due date when clear button clicked', () => {
      renderForm({ dueDate: '2026-03-15' })
      fireEvent.click(screen.getByRole('button', { name: /クリア/i }))
      const input = screen.getByLabelText(/締切日/i) as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('parent todo selector', () => {
    it('should render parent todo select', () => {
      renderForm()
      const select = screen.getByLabelText(/親Todo/i)
      expect(select).toBeInTheDocument()
    })

    it('should not include current todo in parent options', () => {
      renderForm()
      const select = screen.getByLabelText(/親Todo/i) as HTMLSelectElement
      const options = Array.from(select.options).map((o) => o.value)
      expect(options).not.toContain('todo-1')
      expect(options).toContain('todo-2')
      expect(options).toContain('todo-3')
    })
  })

  describe('save button', () => {
    it('should be disabled when no changes made', () => {
      renderForm()
      const saveBtn = screen.getByRole('button', { name: /保存する/i })
      expect(saveBtn).toBeDisabled()
    })

    it('should be enabled after a change', () => {
      renderForm()
      const input = screen.getByDisplayValue('Test Todo')
      fireEvent.change(input, { target: { value: 'Changed' } })
      const saveBtn = screen.getByRole('button', { name: /保存する/i })
      expect(saveBtn).toBeEnabled()
    })

    it('should call onSave with updated data', () => {
      renderForm()
      const input = screen.getByDisplayValue('Test Todo')
      fireEvent.change(input, { target: { value: 'New Title' } })
      fireEvent.click(screen.getByRole('button', { name: /保存する/i }))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Title' })
      )
    })
  })

  describe('delete', () => {
    it('should show delete button', () => {
      renderForm()
      expect(screen.getByRole('button', { name: /削除/i })).toBeInTheDocument()
    })

    it('should show confirmation dialog on delete click', () => {
      renderForm()
      fireEvent.click(screen.getByRole('button', { name: /削除/i }))
      expect(screen.getByText(/本当に削除しますか/i)).toBeInTheDocument()
    })

    it('should call onDelete when confirmed', () => {
      renderForm()
      fireEvent.click(screen.getByRole('button', { name: /削除/i }))
      fireEvent.click(screen.getByRole('button', { name: /確認/i }))
      expect(mockOnDelete).toHaveBeenCalled()
    })

    it('should cancel delete when cancel clicked', () => {
      renderForm()
      fireEvent.click(screen.getByRole('button', { name: /削除/i }))
      fireEvent.click(screen.getByRole('button', { name: /キャンセル/i }))
      expect(mockOnDelete).not.toHaveBeenCalled()
      expect(screen.queryByText(/本当に削除しますか/i)).not.toBeInTheDocument()
    })
  })

  describe('completed toggle', () => {
    it('should show unchecked checkbox for incomplete todo', () => {
      renderForm({ completed: false })
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('should show checked checkbox for completed todo', () => {
      renderForm({ completed: true })
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should toggle completed state', () => {
      renderForm({ completed: false })
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })
  })
})
