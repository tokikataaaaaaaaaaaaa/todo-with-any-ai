import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/ui/bottom-nav'

// Mock next/navigation
let mockPathname = '/todos'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn() }),
}))

describe('BottomNav', () => {
  it('renders four navigation links and one add button', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: /bottom/i })
    const links = nav.querySelectorAll('a')
    expect(links).toHaveLength(4)
    expect(screen.getByTestId('bottom-nav-add')).toBeInTheDocument()
  })

  it('highlights the current page (todos)', () => {
    mockPathname = '/todos'
    render(<BottomNav />)
    const todosLink = screen.getByTestId('bottom-nav-todos')
    expect(todosLink.getAttribute('data-active')).toBe('true')
  })

  it('highlights the current page (calendar)', () => {
    mockPathname = '/calendar'
    render(<BottomNav />)
    const calendarLink = screen.getByTestId('bottom-nav-calendar')
    expect(calendarLink.getAttribute('data-active')).toBe('true')
  })

  it('highlights the current page (projects)', () => {
    mockPathname = '/projects'
    render(<BottomNav />)
    const projectsLink = screen.getByTestId('bottom-nav-projects')
    expect(projectsLink.getAttribute('data-active')).toBe('true')
  })

  it('highlights the current page (settings)', () => {
    mockPathname = '/settings'
    render(<BottomNav />)
    const settingsLink = screen.getByTestId('bottom-nav-settings')
    expect(settingsLink.getAttribute('data-active')).toBe('true')
  })

  it('has sm:hidden class for mobile-only display', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: /bottom/i })
    expect(nav.className).toContain('sm:hidden')
  })

  it('has fixed positioning at the bottom', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: /bottom/i })
    expect(nav.className).toContain('fixed')
    expect(nav.className).toContain('bottom-0')
  })
})
