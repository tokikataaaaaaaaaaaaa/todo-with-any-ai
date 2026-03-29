import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteTodoDialog } from '@/components/todo/delete-todo-dialog'

describe('DeleteTodoDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when open is false', () => {
    const { container } = render(
      <DeleteTodoDialog
        open={false}
        todoTitle="Test"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render when open is true', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Test"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should show simple message when childCount is 0', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Buy milk"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText('このタスクを削除しますか？')).toBeInTheDocument()
  })

  it('should show child count warning when childCount > 0', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Project"
        childCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/子タスク3件も削除されます/)).toBeInTheDocument()
  })

  it('should show child count of 1', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Parent"
        childCount={1}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/子タスク1件も削除されます/)).toBeInTheDocument()
  })

  it('should display the todo title', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Important Task"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/Important Task/)).toBeInTheDocument()
  })

  it('should call onConfirm when delete button is clicked', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Test"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.click(screen.getByText('削除'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Test"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.click(screen.getByText('キャンセル'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should render delete button with danger styling', () => {
    render(
      <DeleteTodoDialog
        open={true}
        todoTitle="Test"
        childCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    const deleteBtn = screen.getByText('削除')
    expect(deleteBtn.className).toMatch(/error|accent/)
  })
})
