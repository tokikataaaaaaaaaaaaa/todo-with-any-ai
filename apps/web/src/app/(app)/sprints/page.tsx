'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X, Check } from 'lucide-react'
import { useSprintStore } from '@/stores/sprint-store'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import type { Sprint, CreateSprint, Todo } from '@todo-with-any-ai/shared'

function SprintSkeleton() {
  return (
    <div className="space-y-3 p-4" data-testid="sprint-skeleton">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-raised)]"
        />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

type PeriodPreset = '1week' | '2weeks' | '1month' | 'custom'

interface CreateDialogProps {
  todos: Todo[]
  onClose: () => void
  onCreate: (data: CreateSprint) => void
}

function CreateSprintDialog({ todos, onClose, onCreate }: CreateDialogProps) {
  const [name, setName] = useState('')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('1week')
  const [startDate, setStartDate] = useState(getToday())
  const [endDate, setEndDate] = useState(addDays(getToday(), 7))
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([])

  const incompleteTodos = useMemo(
    () => todos.filter((t) => !t.completed),
    [todos]
  )

  const handlePresetClick = (preset: PeriodPreset) => {
    setPeriodPreset(preset)
    const today = getToday()
    setStartDate(today)
    if (preset === '1week') setEndDate(addDays(today, 7))
    else if (preset === '2weeks') setEndDate(addDays(today, 14))
    else if (preset === '1month') setEndDate(addDays(today, 30))
  }

  const toggleTodo = (todoId: string) => {
    setSelectedTodoIds((prev) =>
      prev.includes(todoId) ? prev.filter((id) => id !== todoId) : [...prev, todoId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      startDate,
      endDate,
      todoIds: selectedTodoIds,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="sprint-create-dialog">
      <div className="mx-4 w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            New Sprint
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Name
            </label>
            <input
              data-testid="sprint-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Week 14"
              maxLength={50}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Period presets */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Period
            </label>
            <div className="flex gap-2">
              {[
                { key: '1week' as const, label: '1 week' },
                { key: '2weeks' as const, label: '2 weeks' },
                { key: '1month' as const, label: '1 month' },
                { key: 'custom' as const, label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  data-testid={`period-${p.key}`}
                  onClick={() => handlePresetClick(p.key)}
                  className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    periodPreset === p.key
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date pickers (always visible for custom, or show computed dates) */}
          {periodPreset === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Start</label>
                <input
                  data-testid="sprint-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[var(--text-muted)]">End</label>
                <input
                  data-testid="sprint-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </div>
            </div>
          )}

          <div className="text-xs text-[var(--text-muted)]">
            {formatDate(startDate)} - {formatDate(endDate)}
          </div>

          {/* Todo checklist */}
          {incompleteTodos.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Add Todos
              </label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
                {incompleteTodos.map((todo) => (
                  <label
                    key={todo.id}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-sm hover:bg-[var(--bg-raised)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTodoIds.includes(todo.id)}
                      onChange={() => toggleTodo(todo.id)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-[var(--text)]">{todo.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            data-testid="sprint-submit-button"
            disabled={!name.trim()}
            className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            Create Sprint
          </button>
        </form>
      </div>
    </div>
  )
}

interface SprintCardProps {
  sprint: Sprint
  todos: Todo[]
  projects: { id: string; name: string; color: string }[]
  onDelete: (id: string) => void
  onToggleTodo: (todoId: string) => void
  onRemoveTodo: (sprintId: string, todoId: string) => void
}

function SprintCard({ sprint, todos, projects, onDelete, onToggleTodo, onRemoveTodo }: SprintCardProps) {
  const sprintTodos = useMemo(
    () => sprint.todoIds.map((id) => todos.find((t) => t.id === id)).filter(Boolean) as Todo[],
    [sprint.todoIds, todos]
  )

  const completedCount = sprintTodos.filter((t) => t.completed).length
  const totalCount = sprintTodos.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getProjectForTodo = (todo: Todo) => {
    if (!todo.projectId) return null
    return projects.find((p) => p.id === todo.projectId) || null
  }

  return (
    <div
      data-testid={`sprint-card-${sprint.id}`}
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
            {sprint.name}
          </h3>
          <span
            data-testid={`sprint-dates-${sprint.id}`}
            className="text-xs text-[var(--text-muted)]"
          >
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </span>
        </div>
        <button
          data-testid={`sprint-delete-${sprint.id}`}
          onClick={() => onDelete(sprint.id)}
          className="rounded-[var(--radius-md)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span
            data-testid={`sprint-progress-text-${sprint.id}`}
            className="text-[var(--text-secondary)]"
          >
            {completedCount} / {totalCount}
          </span>
          <span className="text-[var(--text-muted)]">{percentage}%</span>
        </div>
        <div
          data-testid={`sprint-progress-${sprint.id}`}
          className="h-2 overflow-hidden rounded-full bg-[var(--bg-raised)]"
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Todo list */}
      {sprintTodos.length > 0 ? (
        <div className="space-y-1">
          {sprintTodos.map((todo) => {
            const project = getProjectForTodo(todo)
            return (
              <div
                key={todo.id}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-[var(--bg-raised)]"
              >
                <button
                  onClick={() => onToggleTodo(todo.id)}
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    todo.completed
                      ? 'border-[var(--success)] bg-[var(--success)]'
                      : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  {todo.completed && <Check className="h-3 w-3 text-white" />}
                </button>
                {project && (
                  <span
                    className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <span
                  className={`flex-1 ${todo.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text)]'}`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => onRemoveTodo(sprint.id, todo.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center text-xs text-[var(--text-muted)]">No todos yet</p>
      )}
    </div>
  )
}

export default function SprintsPage() {
  const sprints = useSprintStore((s) => s.sprints)
  const loading = useSprintStore((s) => s.loading)
  const error = useSprintStore((s) => s.error)
  const fetchSprints = useSprintStore((s) => s.fetchSprints)
  const createSprint = useSprintStore((s) => s.createSprint)
  const deleteSprint = useSprintStore((s) => s.deleteSprint)
  const removeTodoFromSprint = useSprintStore((s) => s.removeTodoFromSprint)

  const todos = useTodoStore((s) => s.todos)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const toggleComplete = useTodoStore((s) => s.toggleComplete)

  const projects = useProjectStore((s) => s.projects)

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchSprints()
    fetchTodos()
  }, [fetchSprints, fetchTodos])

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Sprints
        </h1>
        <SprintSkeleton />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Sprints
        </h1>
        <button
          data-testid="create-sprint-button"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Sprint
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {sprints.length === 0 ? (
        <div
          data-testid="sprint-empty-state"
          className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-12 text-center"
        >
          <p className="mb-2 text-[var(--text-secondary)]">No sprints yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Create a sprint to organize your todos into time-boxed periods
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              todos={todos}
              projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
              onDelete={deleteSprint}
              onToggleTodo={toggleComplete}
              onRemoveTodo={removeTodoFromSprint}
            />
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateSprintDialog
          todos={todos}
          onClose={() => setShowCreateDialog(false)}
          onCreate={createSprint}
        />
      )}
    </div>
  )
}
