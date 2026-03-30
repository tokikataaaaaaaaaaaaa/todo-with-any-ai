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
  urgencyLevelId: null,
  startTime: null,
  endTime: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('DraggableTodo - child to parent promotion in project', () => {
  beforeEach(() => {
    _setCurrentDraggedId(null)
  })

  it('should call onDrop when child is dropped on parent DraggableTodo (before position)', () => {
    const parentTodo = makeTodo({ id: 'parent-a', depth: 0, projectId: 'proj-1' })
    const childTodo = makeTodo({ id: 'child-b', parentId: 'parent-a', depth: 1, projectId: 'proj-1' })
    const allTodos = [parentTodo, childTodo]

    const parentOnDrop = vi.fn()
    const childOnDrop = vi.fn()

    _setCurrentDraggedId('child-b')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={parentOnDrop}>
        <div data-testid="parent-row">Parent Row</div>
        <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={childOnDrop}>
          <div data-testid="child-row">Child Row</div>
        </DraggableTodo>
      </DraggableTodo>
    )

    // Parent DraggableTodo: top=0, height=200 (parent row + child)
    const parentWrapper = screen.getByTestId('draggable-todo-parent-a')
    mockRect(parentWrapper, 0, 200)

    // Drop at the very top of the parent (before position)
    // clientY=10, ratio=10/200=0.05 -> before
    fireDrop(parentWrapper, 10)

    expect(parentOnDrop).toHaveBeenCalledWith('child-b', 'parent-a', 'before')
    expect(childOnDrop).not.toHaveBeenCalled()
  })

  it('should call onDrop when child is dropped on parent DraggableTodo (after position)', () => {
    const parentTodo = makeTodo({ id: 'parent-a', depth: 0, projectId: 'proj-1' })
    const childTodo = makeTodo({ id: 'child-b', parentId: 'parent-a', depth: 1, projectId: 'proj-1' })
    const allTodos = [parentTodo, childTodo]

    const parentOnDrop = vi.fn()
    const childOnDrop = vi.fn()

    _setCurrentDraggedId('child-b')

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={parentOnDrop}>
        <div data-testid="parent-row">Parent Row</div>
        <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={childOnDrop}>
          <div data-testid="child-row">Child Row</div>
        </DraggableTodo>
      </DraggableTodo>
    )

    const parentWrapper = screen.getByTestId('draggable-todo-parent-a')
    mockRect(parentWrapper, 0, 200)

    // clientY=190, ratio=190/200=0.95 -> after
    fireDrop(parentWrapper, 190)

    expect(parentOnDrop).toHaveBeenCalledWith('child-b', 'parent-a', 'after')
    expect(childOnDrop).not.toHaveBeenCalled()
  })

  it('should NOT call onDrop when dropping child on itself (same id)', () => {
    const parentTodo = makeTodo({ id: 'parent-a', depth: 0, projectId: 'proj-1' })
    const childTodo = makeTodo({ id: 'child-b', parentId: 'parent-a', depth: 1, projectId: 'proj-1' })
    const allTodos = [parentTodo, childTodo]

    const childOnDrop = vi.fn()

    _setCurrentDraggedId('child-b')

    render(
      <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={childOnDrop}>
        <div data-testid="child-row">Child Row</div>
      </DraggableTodo>
    )

    const childWrapper = screen.getByTestId('draggable-todo-child-b')
    mockRect(childWrapper, 0, 50)

    fireDrop(childWrapper, 25)

    expect(childOnDrop).not.toHaveBeenCalled()
  })
})
