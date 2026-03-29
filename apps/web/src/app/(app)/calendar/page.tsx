'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'

interface CalendarDay {
  date: Date
  dateStr: string // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay() // Sunday = 0

  const days: CalendarDay[] = []

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    const dateStr = formatDateStr(date)
    days.push({
      date,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const dateStr = formatDateStr(date)
    days.push({
      date,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    })
  }

  // Next month trailing days to fill the grid (6 rows max)
  const totalCells = Math.ceil(days.length / 7) * 7
  const remaining = totalCells - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    const dateStr = formatDateStr(date)
    days.push({
      date,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  return days
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MAX_VISIBLE_TODOS = 2

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const todos = useTodoStore((s) => s.todos)
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  // Filter state: set of active project IDs. null means "all" (including unassigned)
  const [disabledProjectIds, setDisabledProjectIds] = useState<Set<string>>(new Set())

  const allActive = disabledProjectIds.size === 0

  useEffect(() => {
    fetchTodos()
    fetchProjects()
  }, [fetchTodos, fetchProjects])

  const days = useMemo(() => getCalendarDays(year, month), [year, month])

  // Build a map of dateStr -> todos for the displayed month
  const todosByDate = useMemo(() => {
    const map = new Map<string, typeof todos>()
    for (const todo of todos) {
      if (!todo.dueDate) continue
      // Filter by project
      if (!allActive) {
        if (todo.projectId && disabledProjectIds.has(todo.projectId)) continue
        if (!todo.projectId && disabledProjectIds.has('__none__')) continue
      }
      const existing = map.get(todo.dueDate) || []
      existing.push(todo)
      map.set(todo.dueDate, existing)
    }
    return map
  }, [todos, allActive, disabledProjectIds])

  const projectColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) {
      map.set(p.id, p.color)
    }
    return map
  }, [projects])

  const monthYear = new Date(year, month, 1).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  function goToPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  function toggleProjectFilter(projectId: string) {
    setDisabledProjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  function resetFilters() {
    setDisabledProjectIds(new Set())
  }

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="flex flex-col gap-3">
      {/* Filter chips */}
      <div
        data-testid="filter-chip-bar"
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        <button
          data-testid="filter-chip-all"
          data-active={allActive ? 'true' : 'false'}
          onClick={resetFilters}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            allActive
              ? 'bg-[var(--primary)] text-[var(--bg)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-secondary)]'
          }`}
        >
          All
        </button>
        {projects.map((project) => {
          const isActive = !disabledProjectIds.has(project.id)
          return (
            <button
              key={project.id}
              data-testid={`filter-chip-${project.id}`}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => toggleProjectFilter(project.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--primary)] text-[var(--bg)]'
                  : 'bg-[var(--bg-raised)] text-[var(--text-secondary)]'
              }`}
            >
              {project.emoji} {project.name}
            </button>
          )
        })}
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            data-testid="prev-month-btn"
            onClick={goToPrevMonth}
            className="rounded-[var(--radius-lg)] p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">{monthYear}</span>
          <button
            data-testid="next-month-btn"
            onClick={goToNextMonth}
            className="rounded-[var(--radius-lg)] p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          data-testid="today-btn"
          onClick={goToToday}
          className="rounded-[var(--radius-lg)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--bg-raised)]"
        >
          Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-[var(--text-muted)]">
        {dayHeaders.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div data-testid="calendar-grid" className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const dayTodos = day.isCurrentMonth
            ? todosByDate.get(day.dateStr) || []
            : []
          const visibleTodos = dayTodos.slice(0, MAX_VISIBLE_TODOS)
          const overflowCount = dayTodos.length - MAX_VISIBLE_TODOS

          return (
            <div
              key={day.dateStr}
              data-testid={`day-cell-${day.dateStr}`}
              data-today={day.isToday ? 'true' : undefined}
              data-outside={!day.isCurrentMonth ? 'true' : undefined}
              className={`min-h-[4rem] rounded-[var(--radius-md)] border p-1 text-xs ${
                day.isToday
                  ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border)]'
              } ${
                !day.isCurrentMonth
                  ? 'text-[var(--text-muted)]'
                  : 'text-[var(--text)]'
              }`}
            >
              <div className="mb-0.5 text-right font-medium">
                {day.date.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {visibleTodos.map((todo) => {
                  const color = todo.projectId
                    ? projectColorMap.get(todo.projectId) || '#9CA3AF'
                    : '#9CA3AF'
                  return (
                    <Link
                      key={todo.id}
                      href={`/todos/detail?id=${todo.id}`}
                      data-min-tap="true"
                      className="block min-h-[44px] min-w-[44px]"
                    >
                      <div
                        data-testid={`todo-badge-${todo.id}`}
                        data-completed={todo.completed ? 'true' : 'false'}
                        className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight border-l-2 ${
                          todo.completed
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text)]'
                        }`}
                        style={{ borderLeftColor: color }}
                      >
                        {todo.title}
                      </div>
                    </Link>
                  )
                })}
                {overflowCount > 0 && (
                  <div className="text-[10px] text-[var(--text-muted)]">
                    +{overflowCount}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
