import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddTodoModal } from '@/components/todo/add-todo-modal'

// Mock stores used by TodoCreateForm
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: () => vi.fn(),
}))
vi.mock('@/stores/project-store', () => ({
  useProjectStore: () => [],
}))
vi.mock('@/stores/filter-store', () => ({
  useFilterStore: () => 'all',
}))

describe('AddTodoModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<AddTodoModal open={false} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the modal when open is true', () => {
    render(<AddTodoModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('新しいタスク')).toBeInTheDocument()
  })

  it('renders a backdrop overlay', () => {
    render(<AddTodoModal open={true} onClose={vi.fn()} />)
    const backdrop = screen.getByTestId('add-todo-backdrop')
    expect(backdrop).toBeInTheDocument()
  })

  it('renders a drag handle bar', () => {
    render(<AddTodoModal open={true} onClose={vi.fn()} />)
    const handle = screen.getByTestId('add-todo-handle')
    expect(handle).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<AddTodoModal open={true} onClose={onClose} />)
    const backdrop = screen.getByTestId('add-todo-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the TodoCreateForm inside the modal', () => {
    render(<AddTodoModal open={true} onClose={vi.fn()} />)
    // TodoCreateForm renders an input with aria-label "New todo title"
    expect(screen.getByLabelText('New todo title')).toBeInTheDocument()
  })
})
