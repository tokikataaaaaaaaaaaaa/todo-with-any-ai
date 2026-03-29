'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTodoStore } from '@/stores/todo-store'
import { useProjectStore } from '@/stores/project-store'
import { Plus } from 'lucide-react'

const createFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
})

type CreateFormData = z.infer<typeof createFormSchema>

export function TodoCreateForm() {
  const createTodo = useTodoStore((s) => s.createTodo)
  const projects = useProjectStore((s) => s.projects)
  const [selectedProjectId, setSelectedProjectId] = useState('')
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
      dueDate: null,
      priority: null,
      categoryIcon: null,
      projectId: selectedProjectId || null,
      urgencyLevelId: null,
    })
    reset()
    setSelectedProjectId('')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center gap-2 px-4 py-3"
    >
      <input
        {...register('title')}
        placeholder="Add a new todo..."
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        aria-label="New todo title"
        disabled={isSubmitting}
      />
      <select
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        aria-label="プロジェクト"
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
        disabled={isSubmitting}
      >
        <option value="">未分類</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.emoji} {p.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
        aria-label="Create todo"
      >
        <Plus className="h-4 w-4" />
      </button>
      {errors.title && (
        <p className="text-xs text-[var(--error)]" role="alert">
          {errors.title.message}
        </p>
      )}
    </form>
  )
}
