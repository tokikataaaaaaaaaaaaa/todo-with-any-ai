import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomNav } from '@/components/ui/bottom-nav'

// Mock stores used by TodoCreateForm inside AddTodoModal
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: () => vi.fn(),
}))
vi.mock('@/stores/project-store', () => ({
  useProjectStore: () => [],
}))
vi.mock('@/stores/filter-store', () => ({
  useFilterStore: () => 'all',
}))

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

  it('opens AddTodoModal when add button is clicked', async () => {
    mockPathname = '/todos'
    render(<BottomNav />)
    const addButton = screen.getByTestId('bottom-nav-add')
    fireEvent.click(addButton)
    expect(screen.getByText('新しいタスク')).toBeInTheDocument()
  })

  it('has a spacer in the center for the FAB button', () => {
    render(<BottomNav />)
    const spacer = screen.getByTestId('bottom-nav-spacer')
    expect(spacer).toBeInTheDocument()
  })
})
