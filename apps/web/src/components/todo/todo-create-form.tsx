'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTodoStore } from '@/stores/todo-store'
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
      projectId: null,
      urgencyLevelId: null,
    })
    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center gap-2 px-4 py-3"
    >
      <input
        {...register('title')}
        placeholder="Add a new todo..."
        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        aria-label="New todo title"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
        aria-label="Create todo"
      >
        <Plus className="h-4 w-4" />
      </button>
      {errors.title && (
        <p className="text-xs text-red-600" role="alert">
          {errors.title.message}
        </p>
      )}
    </form>
  )
}
