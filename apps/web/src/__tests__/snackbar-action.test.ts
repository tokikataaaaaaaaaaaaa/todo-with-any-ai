import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSnackbarStore } from '@/stores/snackbar-store'

describe('useSnackbarStore - action support', () => {
  beforeEach(() => {
    useSnackbarStore.setState({ messages: [] })
  })

  it('should add a message with an action', () => {
    const onClick = vi.fn()
    useSnackbarStore.getState().addMessage('success', 'Deleted', {
      label: '元に戻す',
      onClick,
    })

    const { messages } = useSnackbarStore.getState()
    expect(messages).toHaveLength(1)
    expect(messages[0].action).toBeDefined()
    expect(messages[0].action?.label).toBe('元に戻す')
  })

  it('should store action onClick function', () => {
    const onClick = vi.fn()
    useSnackbarStore.getState().addMessage('success', 'Deleted', {
      label: '元に戻す',
      onClick,
    })

    const { messages } = useSnackbarStore.getState()
    messages[0].action?.onClick()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should support messages without action (backward compatible)', () => {
    useSnackbarStore.getState().addMessage('success', 'Hello')

    const { messages } = useSnackbarStore.getState()
    expect(messages[0].action).toBeUndefined()
  })

  it('should retain action when multiple messages exist', () => {
    const onClick1 = vi.fn()
    const onClick2 = vi.fn()
    useSnackbarStore.getState().addMessage('success', 'First', {
      label: 'Undo',
      onClick: onClick1,
    })
    useSnackbarStore.getState().addMessage('info', 'Second')
    useSnackbarStore.getState().addMessage('error', 'Third', {
      label: 'Retry',
      onClick: onClick2,
    })

    const { messages } = useSnackbarStore.getState()
    expect(messages[0].action?.label).toBe('Undo')
    expect(messages[1].action).toBeUndefined()
    expect(messages[2].action?.label).toBe('Retry')
  })

  it('should preserve action after removing other messages', () => {
    const onClick = vi.fn()
    useSnackbarStore.getState().addMessage('success', 'Keep', {
      label: 'Action',
      onClick,
    })
    useSnackbarStore.getState().addMessage('info', 'Remove')

    const toRemove = useSnackbarStore.getState().messages[1].id
    useSnackbarStore.getState().removeMessage(toRemove)

    const remaining = useSnackbarStore.getState().messages
    expect(remaining).toHaveLength(1)
    expect(remaining[0].action?.label).toBe('Action')
  })
})
