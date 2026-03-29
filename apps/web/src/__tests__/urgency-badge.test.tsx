import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UrgencyBadge } from '@/components/todo/urgency-badge'
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

describe('UrgencyBadge', () => {
  it('should render nothing when urgencyLevelId is null', () => {
    const { container } = render(
      <UrgencyBadge urgencyLevelId={null} levels={mockLevels} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when urgencyLevelId is undefined', () => {
    const { container } = render(
      <UrgencyBadge urgencyLevelId={undefined} levels={mockLevels} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when levels array is empty', () => {
    const { container } = render(
      <UrgencyBadge urgencyLevelId="ul-1" levels={[]} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when urgencyLevelId does not match any level', () => {
    const { container } = render(
      <UrgencyBadge urgencyLevelId="non-existent" levels={mockLevels} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render the matching level name', () => {
    render(<UrgencyBadge urgencyLevelId="ul-1" levels={mockLevels} />)
    expect(screen.getByText(/Low/)).toBeInTheDocument()
  })

  it('should render the matching level icon', () => {
    render(<UrgencyBadge urgencyLevelId="ul-2" levels={mockLevels} />)
    expect(screen.getByText(/🟡/)).toBeInTheDocument()
  })

  it('should apply the level color as background style', () => {
    render(<UrgencyBadge urgencyLevelId="ul-3" levels={mockLevels} />)
    const badge = screen.getByTestId('urgency-badge')
    expect(badge.style.backgroundColor).toBeTruthy()
  })

  it('should render correct content for each level', () => {
    const { rerender } = render(
      <UrgencyBadge urgencyLevelId="ul-1" levels={mockLevels} />
    )
    expect(screen.getByText(/🟢/)).toBeInTheDocument()
    expect(screen.getByText(/Low/)).toBeInTheDocument()

    rerender(<UrgencyBadge urgencyLevelId="ul-3" levels={mockLevels} />)
    expect(screen.getByText(/🔴/)).toBeInTheDocument()
    expect(screen.getByText(/High/)).toBeInTheDocument()
  })
})
