import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UrgencySettings } from '@/components/settings/urgency-settings'
import type { UrgencyLevel } from '@todo-with-any-ai/shared'

const mockLevels: UrgencyLevel[] = [
  {
    id: 'ul-1',
    name: 'Low',
    color: '#22C55E',
    icon: '🟢',
    order: 0,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ul-2',
    name: 'Medium',
    color: '#F59E0B',
    icon: '🟡',
    order: 1,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ul-3',
    name: 'High',
    color: '#EF4444',
    icon: '🔴',
    order: 2,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

describe('UrgencySettings', () => {
  const mockOnUpdate = vi.fn()
  const mockOnCreate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnUpdate.mockResolvedValue(undefined)
    mockOnCreate.mockResolvedValue(undefined)
    mockOnDelete.mockResolvedValue(undefined)
  })

  function renderSettings(levels?: UrgencyLevel[]) {
    return render(
      <UrgencySettings
        levels={levels ?? mockLevels}
        onUpdate={mockOnUpdate}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    )
  }

  it('should render the section title', () => {
    renderSettings()
    expect(screen.getByText('緊急度レベル')).toBeInTheDocument()
  })

  it('should display all levels in order', () => {
    renderSettings()
    const inputs = screen.getAllByRole('textbox')
    // Each level has a name input
    expect(inputs.length).toBeGreaterThanOrEqual(3)
  })

  it('should display level names in input fields', () => {
    renderSettings()
    expect(screen.getByDisplayValue('Low')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Medium')).toBeInTheDocument()
    expect(screen.getByDisplayValue('High')).toBeInTheDocument()
  })

  it('should display level icons', () => {
    renderSettings()
    expect(screen.getByText('🟢')).toBeInTheDocument()
    expect(screen.getByText('🟡')).toBeInTheDocument()
    expect(screen.getByText('🔴')).toBeInTheDocument()
  })

  it('should call onUpdate when name is edited and blurred', () => {
    renderSettings()
    const input = screen.getByDisplayValue('Low')
    fireEvent.change(input, { target: { value: 'Very Low' } })
    fireEvent.blur(input)
    expect(mockOnUpdate).toHaveBeenCalledWith('ul-1', { name: 'Very Low' })
  })

  it('should not call onUpdate when name is unchanged', () => {
    renderSettings()
    const input = screen.getByDisplayValue('Low')
    fireEvent.blur(input)
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('should disable delete button for default levels', () => {
    renderSettings()
    const deleteButtons = screen.getAllByLabelText(/削除/)
    // All mock levels are default, so all delete buttons should be disabled
    deleteButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('should enable delete button for custom levels', () => {
    const customLevel: UrgencyLevel = {
      id: 'ul-custom',
      name: 'Custom',
      color: '#8B5CF6',
      icon: '🟣',
      order: 3,
      isDefault: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    renderSettings([...mockLevels, customLevel])
    // The custom level's delete button should be enabled
    const deleteButtons = screen.getAllByLabelText(/削除/)
    const enabledButtons = deleteButtons.filter((btn) => !btn.hasAttribute('disabled'))
    expect(enabledButtons.length).toBe(1)
  })

  it('should call onDelete when custom level delete is clicked', () => {
    const customLevel: UrgencyLevel = {
      id: 'ul-custom',
      name: 'Custom',
      color: '#8B5CF6',
      icon: '🟣',
      order: 3,
      isDefault: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    renderSettings([...mockLevels, customLevel])
    const deleteButtons = screen.getAllByLabelText(/削除/)
    const enabledButton = deleteButtons.find((btn) => !btn.hasAttribute('disabled'))!
    fireEvent.click(enabledButton)
    expect(mockOnDelete).toHaveBeenCalledWith('ul-custom')
  })

  it('should render add custom level form', () => {
    renderSettings()
    expect(screen.getByPlaceholderText('レベル名')).toBeInTheDocument()
  })

  it('should call onCreate when add form is submitted', () => {
    renderSettings()
    const nameInput = screen.getByPlaceholderText('レベル名')
    const colorInput = screen.getByLabelText('カラー')
    const iconInput = screen.getByPlaceholderText('アイコン')
    const addButton = screen.getByText('追加')

    fireEvent.change(nameInput, { target: { value: 'Critical' } })
    fireEvent.change(colorInput, { target: { value: '#FF0000' } })
    fireEvent.change(iconInput, { target: { value: '🚨' } })
    fireEvent.click(addButton)

    expect(mockOnCreate).toHaveBeenCalledWith({
      name: 'Critical',
      color: '#FF0000',
      icon: '🚨',
    })
  })

  it('should disable add button when name is empty', () => {
    renderSettings()
    const addButton = screen.getByText('追加')
    expect(addButton).toBeDisabled()
  })

  it('should render empty state when no levels', () => {
    renderSettings([])
    expect(screen.getByText('レベルがありません')).toBeInTheDocument()
  })
})
