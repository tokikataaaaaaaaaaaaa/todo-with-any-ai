import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChildrenProgress } from '@/components/todo/children-progress'

describe('ChildrenProgress', () => {
  it('should render nothing when there are no children (totalCount=0)', () => {
    const { container } = render(
      <ChildrenProgress completedCount={0} totalCount={0} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render progress badge showing "completed/total" format', () => {
    render(<ChildrenProgress completedCount={2} totalCount={5} />)
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  it('should render green badge when all children are completed', () => {
    render(<ChildrenProgress completedCount={3} totalCount={3} />)
    const badge = screen.getByText('3/3')
    expect(badge.className).toMatch(/success/)
  })

  it('should render default badge when not all children are completed', () => {
    render(<ChildrenProgress completedCount={1} totalCount={4} />)
    const badge = screen.getByText('1/4')
    // Default uses CSS variable bg-[var(--bg-raised)], not green
    expect(badge.className).not.toMatch(/green/)
  })

  it('should render badge for single child completed', () => {
    render(<ChildrenProgress completedCount={1} totalCount={1} />)
    const badge = screen.getByText('1/1')
    expect(badge.className).toMatch(/success/)
  })

  it('should render badge when no children are completed', () => {
    render(<ChildrenProgress completedCount={0} totalCount={3} />)
    const badge = screen.getByText('0/3')
    // Default uses CSS variable bg-[var(--bg-raised)], not green
    expect(badge.className).not.toMatch(/green/)
  })

  it('should have accessible role', () => {
    render(<ChildrenProgress completedCount={2} totalCount={5} />)
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('aria-label', '2 of 5 subtasks completed')
  })
})
