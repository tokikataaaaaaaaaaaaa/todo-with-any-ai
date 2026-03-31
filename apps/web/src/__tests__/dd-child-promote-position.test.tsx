import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { DraggableTodo, _setCurrentDraggedId } from '@/components/todo/draggable-todo'
import type { Todo } from '@todo-with-any-ai/shared'

function mockRect(el: HTMLElement, top: number, height: number) {
  el.getBoundingClientRect = () => ({
    top, bottom: top + height, left: 0, right: 300, width: 300, height,
    x: 0, y: top, toJSON: () => {},
  })
}

function fireDrop(el: HTMLElement, clientY: number) {
  const event = new Event('drop', { bubbles: true, cancelable: true }) as Event & { clientY: number }
  Object.defineProperty(event, 'clientY', { value: clientY })
  Object.defineProperty(event, 'dataTransfer', {
    value: { getData: () => '', setData: () => {} },
  })
  act(() => {
    el.dispatchEvent(event)
  })
}

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-1',
  title: 'Test Todo',
  completed: false,
  dueDate: null,
  parentId: null,
  order: 0,
  depth: 0,
  priority: null,
  categoryIcon: null,
  description: null,
  projectId: null,

  startTime: null,
  endTime: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('DraggableTodo - drop position with tall wrapper (parent with children)', () => {
  beforeEach(() => {
    _setCurrentDraggedId(null)
  })

  it('BUG REPRO: dropping below parent row area should give "after" even when wrapper is tall', () => {
    // Scenario: parent has 1 child, parent's DraggableTodo wraps both
    // Parent row is ~50px, child row is ~50px, total height = 100px
    // User drops at y=40 (bottom of parent row)
    //
    // OLD behavior (proportional): ratio = 40/100 = 0.40 -> "child"
    //   This is the bug: the user clearly wants to drop NEAR the parent, not nest inside
    //   The "child" zone was 25-75px (50px range) - way too big for tall wrappers
    //
    // NEW behavior (fixed pixel zones based on ROW_HEIGHT_PX=48):
    //   "before": 0-16px, "child": 16-32px, "after": 32px+
    //   y=40 -> "after" (correct: promotes child to sibling)

    const parentTodo = makeTodo({ id: 'parent', depth: 0, projectId: 'proj-1' })
    const childTodo = makeTodo({ id: 'child', parentId: 'parent', depth: 1, projectId: 'proj-1' })
    const draggedTodo = makeTodo({ id: 'other-child', parentId: 'parent', depth: 1, projectId: 'proj-1' })
    const allTodos = [parentTodo, childTodo, draggedTodo]

    const onDrop = vi.fn()
    _setCurrentDraggedId('other-child')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={onDrop}>
        <div style={{ height: '50px' }}>Parent Row</div>
        <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={vi.fn()}>
          <div style={{ height: '50px' }}>Child Row</div>
        </DraggableTodo>
      </DraggableTodo>
    )

    const parentWrapper = screen.getByTestId('draggable-todo-parent')
    // Total height 100px (parent row 50px + child 50px)
    mockRect(parentWrapper, 0, 100)

    // Drop at y=40 (bottom of parent row area)
    // OLD: ratio = 40/100 = 0.40 -> "child" (BUG)
    // NEW: relativeY=40 > ROW_HEIGHT_PX*0.67=32 -> "after" (FIXED)
    fireDrop(parentWrapper, 40)

    expect(onDrop).toHaveBeenCalled()
    const [, , position] = onDrop.mock.calls[0]
    expect(position).toBe('after')
  })

  it('BUG REPRO: dropping at top of parent row should give "before" even when wrapper is tall', () => {
    const parentTodo = makeTodo({ id: 'parent', depth: 0, projectId: 'proj-1' })
    const childTodo = makeTodo({ id: 'child', parentId: 'parent', depth: 1, projectId: 'proj-1' })
    const draggedTodo = makeTodo({ id: 'other-child', parentId: 'parent', depth: 1, projectId: 'proj-1' })
    const allTodos = [parentTodo, childTodo, draggedTodo]

    const onDrop = vi.fn()
    _setCurrentDraggedId('other-child')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={onDrop}>
        <div style={{ height: '50px' }}>Parent Row</div>
        <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={vi.fn()}>
          <div style={{ height: '50px' }}>Child Row</div>
        </DraggableTodo>
      </DraggableTodo>
    )

    const parentWrapper = screen.getByTestId('draggable-todo-parent')
    mockRect(parentWrapper, 0, 100)

    // Drop at y=10 (top of parent row)
    // OLD: ratio = 10/100 = 0.10 -> "before" (this happened to work)
    // NEW: relativeY=10 < ROW_HEIGHT_PX*0.33=16 -> "before" (still works)
    fireDrop(parentWrapper, 10)

    expect(onDrop).toHaveBeenCalledWith('other-child', 'parent', 'before')
  })

  it('dropping at the very top of parent row should give "before"', () => {
    const parentTodo = makeTodo({ id: 'parent', depth: 0, projectId: 'proj-1' })
    const childTodo = makeTodo({ id: 'child', parentId: 'parent', depth: 1, projectId: 'proj-1' })
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0, projectId: 'proj-1' })
    const allTodos = [parentTodo, childTodo, draggedTodo]

    const onDrop = vi.fn()
    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={onDrop}>
        <div style={{ height: '50px' }}>Parent Row</div>
        <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={vi.fn()}>
          <div style={{ height: '50px' }}>Child Row</div>
        </DraggableTodo>
      </DraggableTodo>
    )

    const parentWrapper = screen.getByTestId('draggable-todo-parent')
    mockRect(parentWrapper, 0, 100)

    // Drop at y=5 (very top)
    // ratio = 5/100 = 0.05 -> "before" (works even with current code)
    fireDrop(parentWrapper, 5)

    expect(onDrop).toHaveBeenCalledWith('dragged', 'parent', 'before')
  })

  it('dropping in the top 12px of parent wrapper should always give "before"', () => {
    const parentTodo = makeTodo({ id: 'parent', depth: 0 })
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0 })
    const allTodos = [parentTodo, draggedTodo]

    const onDrop = vi.fn()
    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={onDrop}>
        <div>Content</div>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-parent')
    // Small wrapper: 48px (single row, no children)
    mockRect(wrapper, 0, 48)

    // Drop at y=10 (within top 12px)
    fireDrop(wrapper, 10)

    expect(onDrop).toHaveBeenCalledWith('dragged', 'parent', 'before')
  })

  it('dropping in the bottom 12px of parent wrapper should always give "after"', () => {
    const parentTodo = makeTodo({ id: 'parent', depth: 0 })
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0 })
    const allTodos = [parentTodo, draggedTodo]

    const onDrop = vi.fn()
    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={onDrop}>
        <div>Content</div>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-parent')
    mockRect(wrapper, 0, 48)

    // Drop at y=40 (within bottom 12px of 48px wrapper)
    fireDrop(wrapper, 40)

    expect(onDrop).toHaveBeenCalledWith('dragged', 'parent', 'after')
  })
})
