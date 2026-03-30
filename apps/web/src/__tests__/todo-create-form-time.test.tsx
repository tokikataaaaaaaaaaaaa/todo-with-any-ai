import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock stores
const mockCreateTodo = vi.fn().mockResolvedValue(undefined)

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector) => {
    const state = { createTodo: mockCreateTodo }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = { projects: [] }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: vi.fn((selector) => {
    const state = { filterType: 'all', projectId: null }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import { TodoCreateForm } from '@/components/todo/todo-create-form'

describe('TodoCreateForm - time inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show time inputs when details are expanded', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    expect(screen.getByLabelText('開始時間')).toBeInTheDocument()
    expect(screen.getByLabelText('終了時間')).toBeInTheDocument()
  })

  it('should disable time inputs when dueDate is not set', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    expect(screen.getByLabelText('開始時間')).toBeDisabled()
    expect(screen.getByLabelText('終了時間')).toBeDisabled()
  })

  it('should enable time inputs when dueDate is set', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-04-01' } })

    expect(screen.getByLabelText('開始時間')).not.toBeDisabled()
    expect(screen.getByLabelText('終了時間')).not.toBeDisabled()
  })

  it('should clear time inputs when dueDate is cleared', () => {
    render(<TodoCreateForm />)
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    // Set dueDate and times
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText('開始時間'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('終了時間'), { target: { value: '10:00' } })

    // Clear dueDate
    fireEvent.click(screen.getByRole('button', { name: /期限クリア/ }))

    expect(screen.getByLabelText('開始時間')).toHaveValue('')
    expect(screen.getByLabelText('終了時間')).toHaveValue('')
  })

  it('should include startTime and endTime in createTodo call', async () => {
    render(<TodoCreateForm />)

    // Fill title
    fireEvent.change(screen.getByLabelText('New todo title'), {
      target: { value: 'Timed task' },
    })

    // Expand details
    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))

    // Set dueDate and times
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText('開始時間'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('終了時間'), { target: { value: '10:00' } })

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Create todo'))
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Timed task',
          dueDate: '2026-04-01',
          startTime: '09:00',
          endTime: '10:00',
        })
      )
    })
  })

  it('should send null for startTime/endTime when not set', async () => {
    render(<TodoCreateForm />)

    fireEvent.change(screen.getByLabelText('New todo title'), {
      target: { value: 'No time task' },
    })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Create todo'))
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: null,
          endTime: null,
        })
      )
    })
  })

  it('should reset time inputs after submission', async () => {
    render(<TodoCreateForm />)

    fireEvent.change(screen.getByLabelText('New todo title'), {
      target: { value: 'Reset time test' },
    })

    fireEvent.click(screen.getByRole('button', { name: /詳細設定/ }))
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText('開始時間'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('終了時間'), { target: { value: '10:00' } })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Create todo'))
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalled()
    })

    expect(screen.getByLabelText('開始時間')).toHaveValue('')
    expect(screen.getByLabelText('終了時間')).toHaveValue('')
  })
})
