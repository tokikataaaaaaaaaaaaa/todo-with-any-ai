import { describe, it, expect, beforeEach } from 'vitest'
import { useSnackbarStore } from '@/stores/snackbar-store'

describe('useSnackbarStore', () => {
  beforeEach(() => {
    useSnackbarStore.setState({ messages: [] })
  })

  describe('addMessage', () => {
    it('should add a message to the messages array', () => {
      useSnackbarStore.getState().addMessage('success', 'Hello')

      const { messages } = useSnackbarStore.getState()
      expect(messages).toHaveLength(1)
      expect(messages[0].message).toBe('Hello')
    })

    it('should auto-generate an id for the message', () => {
      useSnackbarStore.getState().addMessage('success', 'Test')

      const { messages } = useSnackbarStore.getState()
      expect(messages[0].id).toBeDefined()
      expect(typeof messages[0].id).toBe('string')
      expect(messages[0].id.length).toBeGreaterThan(0)
    })

    it('should set type=success correctly', () => {
      useSnackbarStore.getState().addMessage('success', 'OK')

      const { messages } = useSnackbarStore.getState()
      expect(messages[0].type).toBe('success')
    })

    it('should set type=error correctly', () => {
      useSnackbarStore.getState().addMessage('error', 'Failed')

      const { messages } = useSnackbarStore.getState()
      expect(messages[0].type).toBe('error')
    })

    it('should set type=info correctly', () => {
      useSnackbarStore.getState().addMessage('info', 'FYI')

      const { messages } = useSnackbarStore.getState()
      expect(messages[0].type).toBe('info')
    })

    it('should retain all messages when multiple are added', () => {
      useSnackbarStore.getState().addMessage('success', 'First')
      useSnackbarStore.getState().addMessage('error', 'Second')
      useSnackbarStore.getState().addMessage('info', 'Third')

      const { messages } = useSnackbarStore.getState()
      expect(messages).toHaveLength(3)
      expect(messages[0].message).toBe('First')
      expect(messages[1].message).toBe('Second')
      expect(messages[2].message).toBe('Third')
    })

    it('should generate unique ids for each message', () => {
      useSnackbarStore.getState().addMessage('success', 'A')
      useSnackbarStore.getState().addMessage('success', 'B')

      const { messages } = useSnackbarStore.getState()
      expect(messages[0].id).not.toBe(messages[1].id)
    })
  })

  describe('removeMessage', () => {
    it('should remove a message by id', () => {
      useSnackbarStore.getState().addMessage('success', 'To remove')

      const { messages } = useSnackbarStore.getState()
      const id = messages[0].id

      useSnackbarStore.getState().removeMessage(id)

      expect(useSnackbarStore.getState().messages).toHaveLength(0)
    })

    it('should not throw when removing a non-existent id', () => {
      useSnackbarStore.getState().addMessage('success', 'Keep me')

      expect(() => {
        useSnackbarStore.getState().removeMessage('non-existent-id')
      }).not.toThrow()

      expect(useSnackbarStore.getState().messages).toHaveLength(1)
    })

    it('should only remove the targeted message, keeping others', () => {
      useSnackbarStore.getState().addMessage('success', 'Keep')
      useSnackbarStore.getState().addMessage('error', 'Remove')
      useSnackbarStore.getState().addMessage('info', 'Keep too')

      const messages = useSnackbarStore.getState().messages
      const idToRemove = messages[1].id

      useSnackbarStore.getState().removeMessage(idToRemove)

      const remaining = useSnackbarStore.getState().messages
      expect(remaining).toHaveLength(2)
      expect(remaining[0].message).toBe('Keep')
      expect(remaining[1].message).toBe('Keep too')
    })
  })
})
