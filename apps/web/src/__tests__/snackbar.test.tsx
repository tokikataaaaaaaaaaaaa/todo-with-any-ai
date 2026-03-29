import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnackbarProvider } from '@/components/ui/snackbar-provider'
import { useSnackbarStore } from '@/stores/snackbar-store'

describe('SnackbarProvider', () => {
  beforeEach(() => {
    useSnackbarStore.setState({ messages: [] })
  })

  it('should render nothing when there are no messages', () => {
    const { container } = render(<SnackbarProvider />)
    expect(container.querySelector('[data-testid="snackbar-container"]')?.children.length ?? 0).toBe(0)
  })

  it('should display message text', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'success', message: 'Hello World' }],
    })

    render(<SnackbarProvider />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should apply green styling for success type', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'success', message: 'Success!' }],
    })

    render(<SnackbarProvider />)
    const snackbar = screen.getByText('Success!').closest('[data-testid="snackbar-item"]')
    expect(snackbar?.className).toMatch(/emerald/)
  })

  it('should apply red styling for error type', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'error', message: 'Error!' }],
    })

    render(<SnackbarProvider />)
    const snackbar = screen.getByText('Error!').closest('[data-testid="snackbar-item"]')
    expect(snackbar?.className).toMatch(/red/)
  })

  it('should apply blue styling for info type', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'info', message: 'Info!' }],
    })

    render(<SnackbarProvider />)
    const snackbar = screen.getByText('Info!').closest('[data-testid="snackbar-item"]')
    expect(snackbar?.className).toMatch(/indigo/)
  })

  it('should have a close button for each message', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'success', message: 'Closeable' }],
    })

    render(<SnackbarProvider />)
    const closeBtn = screen.getByRole('button', { name: /閉じる|close/i })
    expect(closeBtn).toBeInTheDocument()
  })

  it('should call removeMessage when close button is clicked', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'success', message: 'Remove me' }],
    })

    render(<SnackbarProvider />)
    const closeBtn = screen.getByRole('button', { name: /閉じる|close/i })
    fireEvent.click(closeBtn)

    expect(useSnackbarStore.getState().messages).toHaveLength(0)
  })

  it('should display all messages when multiple are present', () => {
    useSnackbarStore.setState({
      messages: [
        { id: '1', type: 'success', message: 'First message' },
        { id: '2', type: 'error', message: 'Second message' },
        { id: '3', type: 'info', message: 'Third message' },
      ],
    })

    render(<SnackbarProvider />)
    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
    expect(screen.getByText('Third message')).toBeInTheDocument()
  })

  it('should auto-remove messages after timeout', async () => {
    vi.useFakeTimers()

    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'success', message: 'Auto remove' }],
    })

    render(<SnackbarProvider />)
    expect(screen.getByText('Auto remove')).toBeInTheDocument()

    vi.advanceTimersByTime(3100)

    expect(useSnackbarStore.getState().messages).toHaveLength(0)

    vi.useRealTimers()
  })

  it('should render with fixed position at bottom of screen', () => {
    useSnackbarStore.setState({
      messages: [{ id: '1', type: 'success', message: 'Positioned' }],
    })

    const { container } = render(<SnackbarProvider />)
    const wrapper = container.querySelector('[data-testid="snackbar-container"]')
    expect(wrapper?.className).toMatch(/fixed/)
    expect(wrapper?.className).toMatch(/bottom/)
  })
})
