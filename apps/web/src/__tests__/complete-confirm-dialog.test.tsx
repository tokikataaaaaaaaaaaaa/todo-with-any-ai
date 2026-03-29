import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompleteConfirmDialog } from '@/components/todo/complete-confirm-dialog'

describe('CompleteConfirmDialog', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when open is false', () => {
    render(
      <CompleteConfirmDialog
        open={false}
        incompleteCount={3}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render dialog when open is true', () => {
    render(
      <CompleteConfirmDialog
        open={true}
        incompleteCount={3}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should display the number of incomplete subtasks', () => {
    render(
      <CompleteConfirmDialog
        open={true}
        incompleteCount={3}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })

  it('should display singular form for 1 incomplete subtask', () => {
    render(
      <CompleteConfirmDialog
        open={true}
        incompleteCount={1}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText(/1/)).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(
      <CompleteConfirmDialog
        open={true}
        incompleteCount={2}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    const confirmButton = screen.getByRole('button', { name: /complete|confirm|ok/i })
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <CompleteConfirmDialog
        open={true}
        incompleteCount={2}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should contain warning message about incomplete subtasks', () => {
    render(
      <CompleteConfirmDialog
        open={true}
        incompleteCount={5}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    // Check that the dialog mentions incomplete subtasks
    expect(screen.getByText(/未完了.*サブタスク.*5.*件/)).toBeInTheDocument()
  })
})
