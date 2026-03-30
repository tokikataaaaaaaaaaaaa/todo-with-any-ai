import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoDetailForm } from '@/components/todo/todo-detail-form'
import type { Todo } from '@todo-with-any-ai/shared'

const baseTodo: Todo = {
  id: 'todo-1',
  title: 'Test todo',
  completed: false,
  dueDate: '2026-04-01',
  startTime: null,
  endTime: null,
  parentId: null,
  order: 0,
  depth: 0,
  projectId: null,
  priority: null,
  urgencyLevelId: null,
  categoryIcon: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('TodoDetailForm - time inputs', () => {
  const mockSave = vi.fn()
  const mockDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display time inputs', () => {
    render(
      <TodoDetailForm todo={baseTodo} allTodos={[baseTodo]} onSave={mockSave} onDelete={mockDelete} />
    )

    expect(screen.getByLabelText('開始時間')).toBeInTheDocument()
    expect(screen.getByLabelText('終了時間')).toBeInTheDocument()
  })

  it('should disable time inputs when dueDate is empty', () => {
    const todoNoDue = { ...baseTodo, dueDate: null }
    render(
      <TodoDetailForm todo={todoNoDue} allTodos={[todoNoDue]} onSave={mockSave} onDelete={mockDelete} />
    )

    expect(screen.getByLabelText('開始時間')).toBeDisabled()
    expect(screen.getByLabelText('終了時間')).toBeDisabled()
  })

  it('should enable time inputs when dueDate is set', () => {
    render(
      <TodoDetailForm todo={baseTodo} allTodos={[baseTodo]} onSave={mockSave} onDelete={mockDelete} />
    )

    expect(screen.getByLabelText('開始時間')).not.toBeDisabled()
    expect(screen.getByLabelText('終了時間')).not.toBeDisabled()
  })

  it('should populate time inputs from todo data', () => {
    const todoWithTime = { ...baseTodo, startTime: '09:00', endTime: '10:00' }
    render(
      <TodoDetailForm todo={todoWithTime} allTodos={[todoWithTime]} onSave={mockSave} onDelete={mockDelete} />
    )

    expect(screen.getByLabelText('開始時間')).toHaveValue('09:00')
    expect(screen.getByLabelText('終了時間')).toHaveValue('10:00')
  })

  it('should include startTime and endTime in save data', () => {
    render(
      <TodoDetailForm todo={baseTodo} allTodos={[baseTodo]} onSave={mockSave} onDelete={mockDelete} />
    )

    fireEvent.change(screen.getByLabelText('開始時間'), { target: { value: '14:00' } })
    fireEvent.change(screen.getByLabelText('終了時間'), { target: { value: '15:00' } })

    // Click save
    fireEvent.click(screen.getByText('保存する'))

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '14:00',
        endTime: '15:00',
      })
    )
  })

  it('should show calendar add button when dueDate is set', () => {
    render(
      <TodoDetailForm todo={baseTodo} allTodos={[baseTodo]} onSave={mockSave} onDelete={mockDelete} />
    )

    expect(screen.getByRole('button', { name: /カレンダーに追加/ })).toBeInTheDocument()
  })

  it('should not show calendar add button when dueDate is not set', () => {
    const todoNoDue = { ...baseTodo, dueDate: null }
    render(
      <TodoDetailForm todo={todoNoDue} allTodos={[todoNoDue]} onSave={mockSave} onDelete={mockDelete} />
    )

    expect(screen.queryByRole('button', { name: /カレンダーに追加/ })).not.toBeInTheDocument()
  })

  it('should clear time when dueDate is cleared', () => {
    const todoWithTime = { ...baseTodo, startTime: '09:00', endTime: '10:00' }
    render(
      <TodoDetailForm todo={todoWithTime} allTodos={[todoWithTime]} onSave={mockSave} onDelete={mockDelete} />
    )

    // Clear dueDate
    fireEvent.click(screen.getByRole('button', { name: /クリア/ }))

    expect(screen.getByLabelText('開始時間')).toHaveValue('')
    expect(screen.getByLabelText('終了時間')).toHaveValue('')
  })
})
