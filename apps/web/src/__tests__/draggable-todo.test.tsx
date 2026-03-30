import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DraggableTodo, _setCurrentDraggedId } from '@/components/todo/draggable-todo'
import type { Todo } from '@todo-with-any-ai/shared'

/** Helper: mock getBoundingClientRect on an element */
function mockRect(el: HTMLElement, top: number, height: number) {
  el.getBoundingClientRect = () => ({
    top, bottom: top + height, left: 0, right: 300, width: 300, height,
    x: 0, y: top, toJSON: () => {},
  })
}

/**
 * Helper: dispatch a drop event with clientY properly set.
 * jsdom's DragEvent constructor does not forward clientY from init dict,
 * so we create the event manually.
 */
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

function fireDragOver(el: HTMLElement, clientY: number) {
  const event = new Event('dragover', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clientY', { value: clientY })
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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('DraggableTodo', () => {
  let mockOnDrop: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnDrop = vi.fn()
    _setCurrentDraggedId(null)
  })

  it('should render children content', () => {
    const todo = makeTodo()
    render(
      <DraggableTodo todo={todo} allTodos={[todo]} onDrop={mockOnDrop}>
        <span>Child Content</span>
      </DraggableTodo>
    )
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should set draggable attribute on non-touch devices', () => {
    // jsdom has no ontouchstart by default, so this is a PC environment
    const todo = makeTodo()
    render(
      <DraggableTodo todo={todo} allTodos={[todo]} onDrop={mockOnDrop}>
        <span>Drag me</span>
      </DraggableTodo>
    )
    const wrapper = screen.getByTestId('draggable-todo-todo-1')
    expect(wrapper).toHaveAttribute('draggable', 'true')
  })

  it('should set draggable=false on touch devices', () => {
    // Simulate touch device via maxTouchPoints
    const originalMaxTouchPoints = navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, configurable: true })

    const todo = makeTodo()
    render(
      <DraggableTodo todo={todo} allTodos={[todo]} onDrop={mockOnDrop}>
        <span>Drag me</span>
      </DraggableTodo>
    )
    const wrapper = screen.getByTestId('draggable-todo-todo-1')
    expect(wrapper).toHaveAttribute('draggable', 'false')

    // Cleanup
    Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTouchPoints, configurable: true })
  })

  it('should set dataTransfer on drag start', () => {
    const todo = makeTodo({ id: 'drag-item' })
    render(
      <DraggableTodo todo={todo} allTodos={[todo]} onDrop={mockOnDrop}>
        <span>Drag me</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-drag-item')
    const setDataMock = vi.fn()
    fireEvent.dragStart(wrapper, {
      dataTransfer: { setData: setDataMock, effectAllowed: '' },
    })

    expect(setDataMock).toHaveBeenCalledWith('text/plain', 'drag-item')
  })

  it('should call onDrop with child position when dropped on middle zone', () => {
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0 })
    const targetTodo = makeTodo({ id: 'target', depth: 0 })
    const allTodos = [draggedTodo, targetTodo]

    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={targetTodo} allTodos={allTodos} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    // clientY=24, within the "child" zone (ROW_HEIGHT*0.33=16 to ROW_HEIGHT*0.67=32)
    fireDrop(wrapper, 24)

    expect(mockOnDrop).toHaveBeenCalledWith('dragged', 'target', 'child')
  })

  it('should call onDrop with before position when dropped on top area', () => {
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0 })
    const targetTodo = makeTodo({ id: 'target', depth: 0 })
    const allTodos = [draggedTodo, targetTodo]

    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={targetTodo} allTodos={allTodos} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    // clientY=10, ratio=0.1 -> before
    fireDrop(wrapper, 10)

    expect(mockOnDrop).toHaveBeenCalledWith('dragged', 'target', 'before')
  })

  it('should call onDrop with after position when dropped on bottom area', () => {
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0 })
    const targetTodo = makeTodo({ id: 'target', depth: 0 })
    const allTodos = [draggedTodo, targetTodo]

    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={targetTodo} allTodos={allTodos} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    // clientY=90, ratio=0.9 -> after
    fireDrop(wrapper, 90)

    expect(mockOnDrop).toHaveBeenCalledWith('dragged', 'target', 'after')
  })

  it('should not allow drop when depth limit would be exceeded', () => {
    const draggedTodo = makeTodo({ id: 'dragged', depth: 0 })
    const targetTodo = makeTodo({ id: 'target', depth: 9 })
    const allTodos = [draggedTodo, targetTodo]

    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={targetTodo} allTodos={allTodos} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    // Drop in "child" zone (ROW_HEIGHT*0.33=16 to ROW_HEIGHT*0.67=32), depth 9 + 1 = 10 -> blocked
    fireDrop(wrapper, 24)

    expect(mockOnDrop).not.toHaveBeenCalled()
  })

  it('should not allow drop on own descendant (circular reference prevention)', () => {
    const parentTodo = makeTodo({ id: 'parent', depth: 0 })
    const childTodo = makeTodo({ id: 'child', parentId: 'parent', depth: 1 })
    const grandchildTodo = makeTodo({ id: 'grandchild', parentId: 'child', depth: 2 })
    const allTodos = [parentTodo, childTodo, grandchildTodo]

    _setCurrentDraggedId('parent')

    render(
      <DraggableTodo todo={grandchildTodo} allTodos={allTodos} onDrop={mockOnDrop}>
        <span>Grandchild target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-grandchild')
    mockRect(wrapper, 0, 100)

    fireDrop(wrapper, 50)

    expect(mockOnDrop).not.toHaveBeenCalled()
  })

  it('should not allow drop on itself', () => {
    const todo = makeTodo({ id: 'self' })

    _setCurrentDraggedId('self')

    render(
      <DraggableTodo todo={todo} allTodos={[todo]} onDrop={mockOnDrop}>
        <span>Self</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-self')
    mockRect(wrapper, 0, 100)

    fireDrop(wrapper, 50)

    expect(mockOnDrop).not.toHaveBeenCalled()
  })

  it('should not allow drop across different projects', () => {
    const draggedTodo = makeTodo({ id: 'dragged', projectId: 'project-a' })
    const targetTodo = makeTodo({ id: 'target', projectId: 'project-b' })
    const allTodos = [draggedTodo, targetTodo]

    _setCurrentDraggedId('dragged')

    render(
      <DraggableTodo todo={targetTodo} allTodos={allTodos} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    fireDrop(wrapper, 50)

    expect(mockOnDrop).not.toHaveBeenCalled()
  })

  it('should show drop indicator during drag over', () => {
    const targetTodo = makeTodo({ id: 'target', depth: 0 })

    render(
      <DraggableTodo todo={targetTodo} allTodos={[targetTodo]} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    fireDragOver(wrapper, 50)

    const indicator = wrapper.querySelector('[data-testid="drop-indicator"]')
    expect(indicator).toBeInTheDocument()
  })

  it('should clear drop indicator on drag leave', () => {
    const todo = makeTodo({ id: 'target' })
    render(
      <DraggableTodo todo={todo} allTodos={[todo]} onDrop={mockOnDrop}>
        <span>Target</span>
      </DraggableTodo>
    )

    const wrapper = screen.getByTestId('draggable-todo-target')
    mockRect(wrapper, 0, 100)

    // First dragOver to set indicator
    fireDragOver(wrapper, 50)

    // Then drag leave
    act(() => {
      fireEvent.dragLeave(wrapper)
    })

    const indicator = wrapper.querySelector('[data-testid="drop-indicator"]')
    expect(indicator).not.toBeInTheDocument()
  })

  it('should stop propagation on drop so parent DraggableTodo does not also fire', () => {
    const parentTodo = makeTodo({ id: 'parent', depth: 0 })
    const childTodo = makeTodo({ id: 'child', parentId: 'parent', depth: 1 })
    const draggedTodo = makeTodo({ id: 'dragged', parentId: 'parent', depth: 1 })
    const allTodos = [parentTodo, childTodo, draggedTodo]

    _setCurrentDraggedId('dragged')

    const parentOnDrop = vi.fn()
    const childOnDrop = vi.fn()

    render(
      <DraggableTodo todo={parentTodo} allTodos={allTodos} onDrop={parentOnDrop}>
        <div>
          <DraggableTodo todo={childTodo} allTodos={allTodos} onDrop={childOnDrop}>
            <span>Child</span>
          </DraggableTodo>
        </div>
      </DraggableTodo>
    )

    const childWrapper = screen.getByTestId('draggable-todo-child')
    mockRect(childWrapper, 0, 100)

    // Drop on the child (before position)
    fireDrop(childWrapper, 10)

    // Child's onDrop should be called
    expect(childOnDrop).toHaveBeenCalledWith('dragged', 'child', 'before')
    // Parent's onDrop should NOT be called (event should be stopped)
    expect(parentOnDrop).not.toHaveBeenCalled()
  })
})
