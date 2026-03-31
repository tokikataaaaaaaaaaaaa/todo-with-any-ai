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
  description: null,
  projectId: null,

  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const PROJECT_A = 'project-a'

const allTodos: Todo[] = [
  { ...baseTodo, projectId: PROJECT_A },
  { ...baseTodo, id: 'todo-2', title: 'Parent Todo', projectId: PROJECT_A },
  { ...baseTodo, id: 'todo-3', title: 'Another Todo', projectId: PROJECT_A },
  { ...baseTodo, id: 'todo-4', title: 'Different Project Todo', projectId: 'project-b' },
  { ...baseTodo, id: 'todo-5', title: 'Completed Todo', projectId: PROJECT_A, completed: true },
  { ...baseTodo, id: 'todo-6', title: 'Child of Current', projectId: PROJECT_A, parentId: 'todo-1' },
]

describe('TodoDetailForm', () => {
  const mockOnSave = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
    mockOnDelete.mockResolvedValue(undefined)
  })

  function renderForm(todoOverrides?: Partial<Todo>, todosOverride?: Todo[]) {
    const todo = { ...baseTodo, projectId: PROJECT_A, ...todoOverrides }
    return render(
      <TodoDetailForm
        todo={todo}
        allTodos={todosOverride ?? allTodos}
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

  describe('category section removed', () => {
    it('should not render category chips', () => {
      renderForm()
      expect(screen.queryByText('カテゴリ')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /work/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /personal/i })).not.toBeInTheDocument()
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
    })

    it('should only show todos from the same project', () => {
      renderForm()
      const select = screen.getByLabelText(/親Todo/i) as HTMLSelectElement
      const options = Array.from(select.options).map((o) => o.value)
      // todo-4 is in project-b, should not appear
      expect(options).not.toContain('todo-4')
      // todo-2 is in project-a, should appear
      expect(options).toContain('todo-2')
    })

    it('should exclude completed todos from parent options', () => {
      renderForm()
      const select = screen.getByLabelText(/親Todo/i) as HTMLSelectElement
      const options = Array.from(select.options).map((o) => o.value)
      // todo-5 is completed, should not appear
      expect(options).not.toContain('todo-5')
    })

    it('should exclude descendants to prevent circular reference', () => {
      renderForm()
      const select = screen.getByLabelText(/親Todo/i) as HTMLSelectElement
      const options = Array.from(select.options).map((o) => o.value)
      // todo-6 is a child of todo-1 (current), should not appear
      expect(options).not.toContain('todo-6')
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
