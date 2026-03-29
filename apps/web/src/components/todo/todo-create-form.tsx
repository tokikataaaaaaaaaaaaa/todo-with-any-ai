'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { useFilterStore } from '@/stores/filter-store'
import {
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Briefcase,
  User,
  ShoppingCart,
  Heart,
  BookOpen,
  Lightbulb,
} from 'lucide-react'

const createFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
})

type CreateFormData = z.infer<typeof createFormSchema>

type Priority = 'high' | 'medium' | 'low' | null
type CategoryIcon = 'work' | 'personal' | 'shopping' | 'health' | 'study' | 'idea' | null

const CATEGORIES: { value: NonNullable<CategoryIcon>; icon: typeof Briefcase; label: string }[] = [
  { value: 'work', icon: Briefcase, label: 'work' },
  { value: 'personal', icon: User, label: 'personal' },
  { value: 'shopping', icon: ShoppingCart, label: 'shopping' },
  { value: 'health', icon: Heart, label: 'health' },
  { value: 'study', icon: BookOpen, label: 'study' },
  { value: 'idea', icon: Lightbulb, label: 'idea' },
]

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
  { value: null, label: 'なし' },
]

export function TodoCreateForm() {
  const createTodo = useTodoStore((s) => s.createTodo)
  const projects = useProjectStore((s) => s.projects)
  const filterType = useFilterStore((s) => s.filterType)
  const filterProjectId = useFilterStore((s) => s.projectId)
  const [selectedProjectId, setSelectedProjectId] = useState(
    filterType === 'project' && filterProjectId ? filterProjectId : ''
  )

  useEffect(() => {
    if (filterType === 'project' && filterProjectId) {
      setSelectedProjectId(filterProjectId)
    }
  }, [filterType, filterProjectId])

  const [showDetails, setShowDetails] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>(null)
  const [categoryIcon, setCategoryIcon] = useState<CategoryIcon>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { title: '' },
  })

  const onSubmit = async (data: CreateFormData) => {
    await createTodo({
      title: data.title,
      completed: false,
      parentId: null,
      order: 0,
      depth: 0,
      dueDate: dueDate || null,
      priority: priority,
      categoryIcon: categoryIcon,
      projectId: selectedProjectId || null,
      urgencyLevelId: null,
    })
    reset()
    setSelectedProjectId('')
    setDueDate('')
    setPriority(null)
    setCategoryIcon(null)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <input
          {...register('title')}
          placeholder="新しいタスクを追加..."
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="New todo title"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
          aria-label="Create todo"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {errors.title && (
        <p className="mt-1 text-xs text-[var(--error)]" role="alert">
          {errors.title.message}
        </p>
      )}

      {/* Details toggle */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="mt-2 flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        aria-label="詳細設定"
      >
        {showDetails ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        詳細設定
      </button>

      {/* Details section */}
      {showDetails && (
        <div className="mt-2 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          {/* Project */}
          <div className="flex items-center gap-2">
            <label htmlFor="create-project" className="w-20 text-xs text-[var(--text-secondary)]">
              プロジェクト
            </label>
            <select
              id="create-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="プロジェクト"
              className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
              disabled={isSubmitting}
            >
              <option value="">未分類</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-2">
            <label htmlFor="create-due-date" className="w-20 text-xs text-[var(--text-secondary)]">
              期限
            </label>
            <input
              id="create-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="期限"
              className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setDueDate('')}
              aria-label="期限クリア"
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs text-[var(--text-secondary)]">優先度</span>
            <div className="flex gap-1">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.value
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      if (p.value === null) {
                        setPriority(null)
                      } else {
                        setPriority(isSelected ? null : p.value)
                      }
                    }}
                    aria-label={p.label}
                    aria-pressed={isSelected}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category icon */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs text-[var(--text-secondary)]">アイコン</span>
            <div className="flex gap-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = categoryIcon === cat.value
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryIcon(isSelected ? null : cat.value)}
                    aria-label={cat.label}
                    aria-pressed={isSelected}
                    className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
