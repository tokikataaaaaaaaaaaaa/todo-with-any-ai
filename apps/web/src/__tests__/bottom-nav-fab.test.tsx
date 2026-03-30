import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/ui/bottom-nav'

// Mock next/navigation
let mockPathname = '/todos'
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))

describe('BottomNav - center FAB button', () => {
  it('renders a center add button', () => {
    render(<BottomNav />)
    const addButton = screen.getByTestId('bottom-nav-add')
    expect(addButton).toBeInTheDocument()
  })

  it('renders the add button as a round button with Plus icon', () => {
    render(<BottomNav />)
    const addButton = screen.getByTestId('bottom-nav-add')
    expect(addButton.tagName).toBe('BUTTON')
    expect(addButton.className).toContain('rounded-full')
  })

  it('still renders 4 navigation links plus the add button', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: /bottom/i })
    const links = nav.querySelectorAll('a')
    expect(links).toHaveLength(4)
    const addButton = screen.getByTestId('bottom-nav-add')
    expect(addButton).toBeInTheDocument()
  })

  it('navigates to /todos on add button click when not on todos page', () => {
    mockPathname = '/calendar'
    render(<BottomNav />)
    const addButton = screen.getByTestId('bottom-nav-add')
    addButton.click()
    expect(mockPush).toHaveBeenCalledWith('/todos')
  })
})
