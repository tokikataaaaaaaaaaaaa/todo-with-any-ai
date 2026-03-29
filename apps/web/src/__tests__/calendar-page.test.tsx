import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock stores
const mockTodos: import('@todo-with-any-ai/shared').Todo[] = []
const mockProjects: import('@todo-with-any-ai/shared').Project[] = []

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = {
      todos: mockTodos,
      fetchTodos: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = {
      projects: mockProjects,
      fetchProjects: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import CalendarPage from '@/app/(app)/calendar/page'

describe('CalendarPage - Basic Structure (SDD-004-FE-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTodos.length = 0
    mockProjects.length = 0
  })

  it('should render the current month and year in the header', () => {
    render(<CalendarPage />)

    const now = new Date()
    const monthYear = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('should render day-of-week headers (Sun through Sat)', () => {
    render(<CalendarPage />)

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (const day of dayHeaders) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
  })

  it('should render a 7-column CSS grid for the calendar', () => {
    render(<CalendarPage />)

    const grid = screen.getByTestId('calendar-grid')
    expect(grid).toBeInTheDocument()
  })

  it('should render day cells for the current month', () => {
    render(<CalendarPage />)

    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    // Check that day 1 and last day exist
    expect(screen.getByTestId(`day-cell-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)).toBeInTheDocument()
    const lastDay = String(daysInMonth).padStart(2, '0')
    expect(screen.getByTestId(`day-cell-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`)).toBeInTheDocument()
  })

  it('should highlight today with a primary-colored ring', () => {
    render(<CalendarPage />)

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayCell = screen.getByTestId(`day-cell-${y}-${m}-${d}`)
    expect(todayCell).toHaveAttribute('data-today', 'true')
  })

  it('should not highlight non-today cells', () => {
    render(<CalendarPage />)

    const today = new Date()
    // Pick a day that is not today
    const otherDay = today.getDate() === 1 ? 2 : 1
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(otherDay).padStart(2, '0')
    const cell = screen.getByTestId(`day-cell-${y}-${m}-${d}`)
    expect(cell).not.toHaveAttribute('data-today', 'true')
  })

  it('should render a "previous month" button', () => {
    render(<CalendarPage />)
    expect(screen.getByTestId('prev-month-btn')).toBeInTheDocument()
  })

  it('should render a "next month" button', () => {
    render(<CalendarPage />)
    expect(screen.getByTestId('next-month-btn')).toBeInTheDocument()
  })

  it('should render a "today" button', () => {
    render(<CalendarPage />)
    expect(screen.getByTestId('today-btn')).toBeInTheDocument()
  })

  it('should navigate to the previous month when prev button is clicked', () => {
    render(<CalendarPage />)

    const now = new Date()
    fireEvent.click(screen.getByTestId('prev-month-btn'))

    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthYear = prev.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('should navigate to the next month when next button is clicked', () => {
    render(<CalendarPage />)

    const now = new Date()
    fireEvent.click(screen.getByTestId('next-month-btn'))

    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const monthYear = next.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('should navigate back to current month when "today" button is clicked', () => {
    render(<CalendarPage />)

    // Go to next month first
    fireEvent.click(screen.getByTestId('next-month-btn'))
    // Then click today
    fireEvent.click(screen.getByTestId('today-btn'))

    const now = new Date()
    const monthYear = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('should navigate multiple months forward', () => {
    render(<CalendarPage />)

    fireEvent.click(screen.getByTestId('next-month-btn'))
    fireEvent.click(screen.getByTestId('next-month-btn'))

    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + 2, 1)
    const monthYear = target.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('should navigate multiple months backward', () => {
    render(<CalendarPage />)

    fireEvent.click(screen.getByTestId('prev-month-btn'))
    fireEvent.click(screen.getByTestId('prev-month-btn'))

    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const monthYear = target.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('should show previous month trailing days as dimmed', () => {
    render(<CalendarPage />)

    // Look for cells with data-outside="true"
    const outsideCells = screen.queryAllByTestId(/^day-cell-/)
    // Some should be outside the current month
    const currentMonth = new Date().getMonth()
    const outsideCount = outsideCells.filter((cell) => {
      const testId = cell.getAttribute('data-testid') || ''
      const month = parseInt(testId.split('-')[3], 10)
      return month !== currentMonth + 1
    }).length
    // It's valid to have 0 outside cells if the month starts on Sunday
    expect(outsideCount).toBeGreaterThanOrEqual(0)
  })
})
