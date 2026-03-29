'use client'

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { Project } from '@todo-with-any-ai/shared'
import { Plus, Pencil, RefreshCw } from 'lucide-react'

const COLOR_OPTIONS = [
  '#6366F1', // Indigo
  '#E11D48', // Rose
  '#D97706', // Amber
  '#059669', // Emerald
  '#0284C7', // Sky
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#52525B', // Zinc
]

const EMOJI_PRESETS = [
  '\u{1F4BC}', // 💼
  '\u{1F3E0}', // 🏠
  '\u{1F6D2}', // 🛒
  '\u{1F4AA}', // 💪
  '\u{1F4DA}', // 📚
  '\u{1F4A1}', // 💡
  '\u{1F3AF}', // 🎯
  '\u{1F527}', // 🔧
  '\u{1F4F1}', // 📱
  '\u{1F3A8}', // 🎨
  '\u{1F3C3}', // 🏃
  '\u{1F37D}\u{FE0F}', // 🍽️
  '\u{1F4CA}', // 📊
  '\u{1F3B5}', // 🎵
  '\u{2708}\u{FE0F}', // ✈️
  '\u{1F431}', // 🐱
  '\u{1F31F}', // 🌟
  '\u{1F52C}', // 🔬
  '\u{1F4DD}', // 📝
  '\u{1F3B2}', // 🎲
]

function ProjectSkeleton() {
  return (
    <div className="space-y-2 p-4" data-testid="project-skeleton">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-14 animate-pulse items-center gap-3 rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  )
}

interface ProjectDialogProps {
  title: string
  initialName?: string
  initialColor?: string
  initialEmoji?: string
  onSubmit: (data: { name: string; color: string; emoji: string }) => void
  onCancel: () => void
  submitLabel: string
  onDelete?: () => void
}

function ProjectDialog({
  title,
  initialName = '',
  initialColor = COLOR_OPTIONS[0],
  initialEmoji = EMOJI_PRESETS[0],
  onSubmit,
  onCancel,
  submitLabel,
  onDelete,
}: ProjectDialogProps) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color, emoji })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>

        <div className="space-y-4">
          {/* Name input */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名"
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
              カラー
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`color-option-${c}`}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c
                      ? 'border-zinc-900 scale-110 dark:border-white'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
              アイコン
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  data-testid={`emoji-option-${e}`}
                  onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all ${
                    emoji === e
                      ? 'bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-900'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            キャンセル
          </button>
        </div>

        {/* Delete in edit mode */}
        {onDelete && (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                削除
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  本当に削除しますか？
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    確認
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const loading = useProjectStore((s) => s.loading)
  const error = useProjectStore((s) => s.error)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const createProject = useProjectStore((s) => s.createProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreate = async (data: { name: string; color: string; emoji: string }) => {
    await createProject({ ...data, dueDate: null })
    setShowCreateDialog(false)
  }

  const handleUpdate = async (data: { name: string; color: string; emoji: string }) => {
    if (!editingProject) return
    await updateProject(editingProject.id, data)
    setEditingProject(null)
  }

  const handleDelete = async () => {
    if (!editingProject) return
    await deleteProject(editingProject.id)
    setEditingProject(null)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          type="button"
          aria-label="新規プロジェクト"
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {loading && <ProjectSkeleton />}

      {error && (
        <div className="mx-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            プロジェクトがありません
          </p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="space-y-1 px-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
            >
              <span className="text-xl">{project.emoji}</span>
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {project.name}
              </span>
              <button
                type="button"
                data-testid={`edit-project-${project.id}`}
                onClick={() => setEditingProject(project)}
                className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label={`Edit ${project.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {showCreateDialog && (
        <ProjectDialog
          title="プロジェクト作成"
          onSubmit={handleCreate}
          onCancel={() => setShowCreateDialog(false)}
          submitLabel="作成"
        />
      )}

      {/* Edit dialog */}
      {editingProject && (
        <ProjectDialog
          title="プロジェクト編集"
          initialName={editingProject.name}
          initialColor={editingProject.color}
          initialEmoji={editingProject.emoji}
          onSubmit={handleUpdate}
          onCancel={() => setEditingProject(null)}
          submitLabel="保存"
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
