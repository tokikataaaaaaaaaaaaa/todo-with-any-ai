import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiKeyCreateDialog } from '@/components/settings/api-key-create-dialog'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

describe('ApiKeyCreateDialog', () => {
  const mockOnCreate = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnCreate.mockResolvedValue({ key: 'sk-generated-key-123' })
  })

  function renderDialog(open = true) {
    return render(
      <ApiKeyCreateDialog
        open={open}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    )
  }

  describe('Step 1: Key name input', () => {
    it('should show key name input field', () => {
      renderDialog()
      expect(screen.getByLabelText(/キー名/i)).toBeInTheDocument()
    })

    it('should show create button', () => {
      renderDialog()
      expect(screen.getByRole('button', { name: /発行する/i })).toBeInTheDocument()
    })

    it('should disable create button when name is empty', () => {
      renderDialog()
      const createBtn = screen.getByRole('button', { name: /発行する/i })
      expect(createBtn).toBeDisabled()
    })

    it('should enable create button when name is entered', () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      const createBtn = screen.getByRole('button', { name: /発行する/i })
      expect(createBtn).toBeEnabled()
    })

    it('should call onCreate with key name', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith('My Key')
      })
    })

    it('should show error for name exceeding 100 characters', () => {
      renderDialog()
      const longName = 'a'.repeat(101)
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: longName } })
      expect(screen.getByText(/100文字以内/i)).toBeInTheDocument()
    })
  })

  describe('Step 2: Key display', () => {
    it('should show generated key after creation', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        expect(screen.getByText('sk-generated-key-123')).toBeInTheDocument()
      })
    })

    it('should show warning about one-time display', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        expect(screen.getByText(/1回のみ表示/i)).toBeInTheDocument()
      })
    })

    it('should show copy button', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /コピー/i })).toBeInTheDocument()
      })
    })

    it('should copy key to clipboard on copy button click', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /コピー/i }))
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk-generated-key-123')
    })

    it('should show close button in step 2', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /閉じる/i })).toBeInTheDocument()
      })
    })

    it('should call onClose when close button clicked in step 2', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /閉じる/i }))
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should display key in monospace font', async () => {
      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        const keyEl = screen.getByText('sk-generated-key-123')
        expect(keyEl).toHaveClass('font-mono')
      })
    })
  })

  describe('not rendered when closed', () => {
    it('should not render when open is false', () => {
      renderDialog(false)
      expect(screen.queryByLabelText(/キー名/i)).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should disable button while creating', async () => {
      let resolveCreate: (value: { key: string }) => void
      mockOnCreate.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve }))

      renderDialog()
      fireEvent.change(screen.getByLabelText(/キー名/i), { target: { value: 'My Key' } })
      fireEvent.click(screen.getByRole('button', { name: /発行する/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /発行中/i })).toBeDisabled()
      })

      resolveCreate!({ key: 'sk-123' })
    })
  })
})
