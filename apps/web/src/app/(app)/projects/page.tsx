'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { useFilterStore } from '@/stores/filter-store'
import type { Project } from '@todo-with-any-ai/shared'
import { Plus, Pencil, RefreshCw } from 'lucide-react'

const COLOR_OPTIONS = [
  '#C4453C', // Shu
  '#2E5C3F', // Matcha
  '#234B6E', // Ai
  '#D4A017', // Yamabuki
  '#1A1A1A', // Sumi
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#52525B', // Zinc
]

const EMOJI_PRESETS = [
  '\u{1F4BC}', // briefcase
  '\u{1F3E0}', // house
  '\u{1F6D2}', // cart
  '\u{1F4AA}', // muscle
  '\u{1F4DA}', // books
  '\u{1F4A1}', // bulb
  '\u{1F3AF}', // target
  '\u{1F527}', // wrench
  '\u{1F4F1}', // phone
  '\u{1F3A8}', // art
  '\u{1F3C3}', // runner
  '\u{1F37D}\u{FE0F}', // plate
  '\u{1F4CA}', // chart
  '\u{1F3B5}', // music
  '\u{2708}\u{FE0F}', // plane
  '\u{1F431}', // cat
  '\u{1F31F}', // star
  '\u{1F52C}', // microscope
  '\u{1F4DD}', // memo
  '\u{1F3B2}', // dice
]

function ProjectSkeleton() {
  return (
    <div className="space-y-2 p-4" data-testid="project-skeleton">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-14 animate-pulse items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--bg-raised)]"
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
      <div className="mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
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
              className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
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
                      ? 'border-[var(--text)] scale-110'
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
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              アイコン
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  data-testid={`emoji-option-${e}`}
                  onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] text-lg transition-all ${
                    emoji === e
                      ? 'bg-[var(--accent-light)] ring-2 ring-[var(--accent)]'
                      : 'hover:bg-[var(--bg-raised)]'
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
            className="flex-1 rounded-[var(--radius-lg)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-raised)]"
          >
            キャンセル
          </button>
        </div>

        {/* Delete in edit mode */}
        {onDelete && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-[var(--radius-lg)] border border-[var(--error)]/30 px-4 py-2 text-sm font-medium text-[var(--error)] hover:bg-[var(--accent-light)]"
              >
                削除
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--error)]">
                  本当に削除しますか？
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 rounded-[var(--radius-lg)] bg-[var(--error)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    確認
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-raised)]"
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
  const router = useRouter()
  const projects = useProjectStore((s) => s.projects)
  const loading = useProjectStore((s) => s.loading)
  const error = useProjectStore((s) => s.error)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const createProject = useProjectStore((s) => s.createProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const setFilter = useFilterStore((s) => s.setFilter)

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
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Projects</h1>
        <button
          type="button"
          aria-label="新規プロジェクト"
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary)] text-[var(--bg)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {loading && <ProjectSkeleton />}

      {error && (
        <div className="mx-4 rounded-[var(--radius-lg)] border border-[var(--error)]/20 bg-[var(--accent-light)] p-4">
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--error)] hover:opacity-80"
          >
            <RefreshCw className="h-3 w-3" />
            再試行
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            プロジェクトがありません
          </p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="space-y-1 px-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] p-3"
            >
              <span className="text-xl">{project.emoji}</span>
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <button
                type="button"
                onClick={() => {
                  setFilter('project', project.id)
                  router.push('/todos')
                }}
                className="flex-1 cursor-pointer text-left text-sm font-medium text-[var(--text)] hover:text-[var(--accent)]"
              >
                {project.name}
              </button>
              <button
                type="button"
                data-testid={`edit-project-${project.id}`}
                onClick={() => setEditingProject(project)}
                className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-secondary)]"
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
