import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteProjectDialog } from '@/components/project/delete-project-dialog'

describe('DeleteProjectDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when open is false', () => {
    const { container } = render(
      <DeleteProjectDialog
        open={false}
        projectName="My Project"
        todoCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render dialog when open is true', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="My Project"
        todoCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should show simple confirmation when todoCount is 0', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="Empty Project"
        todoCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/Empty Project/)).toBeInTheDocument()
    // No radio buttons needed
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('should show choice radio buttons when todoCount > 0', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="Busy Project"
        todoCount={5}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/タスク5件/)).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('should show delete-todos option', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByLabelText(/タスクも削除/)).toBeInTheDocument()
  })

  it('should show move-to-uncategorized option', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByLabelText(/未分類に移動/)).toBeInTheDocument()
  })

  it('should disable delete button when todoCount > 0 and no option selected', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    const deleteBtn = screen.getByText('削除')
    expect(deleteBtn).toBeDisabled()
  })

  it('should enable delete button when todoCount is 0', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    const deleteBtn = screen.getByText('削除')
    expect(deleteBtn).not.toBeDisabled()
  })

  it('should enable delete button after selecting an option', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    const radio = screen.getByLabelText(/タスクも削除/)
    fireEvent.click(radio)
    const deleteBtn = screen.getByText('削除')
    expect(deleteBtn).not.toBeDisabled()
  })

  it('should call onConfirm with "delete" when delete-todos option is selected', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.click(screen.getByLabelText(/タスクも削除/))
    fireEvent.click(screen.getByText('削除'))
    expect(mockOnConfirm).toHaveBeenCalledWith('delete')
  })

  it('should call onConfirm with "move" when move option is selected', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.click(screen.getByLabelText(/未分類に移動/))
    fireEvent.click(screen.getByText('削除'))
    expect(mockOnConfirm).toHaveBeenCalledWith('move')
  })

  it('should call onConfirm with "delete" when todoCount is 0', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.click(screen.getByText('削除'))
    expect(mockOnConfirm).toHaveBeenCalledWith('delete')
  })

  it('should call onCancel when cancel is clicked', () => {
    render(
      <DeleteProjectDialog
        open={true}
        projectName="P"
        todoCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )
    fireEvent.click(screen.getByText('キャンセル'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})
