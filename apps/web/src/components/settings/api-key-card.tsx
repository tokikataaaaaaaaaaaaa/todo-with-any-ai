'use client'

import type { ApiKey } from '@todo-with-any-ai/shared'

interface ApiKeyCardProps {
  apiKey: ApiKey
  onDelete: (id: string) => void
}

function formatDate(dateStr: string): string {
  return dateStr.slice(0, 10)
}

export function ApiKeyCard({ apiKey, onDelete }: ApiKeyCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
      <div className="space-y-1">
        <p className="font-medium">{apiKey.name}</p>
        <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>作成日: {formatDate(apiKey.createdAt)}</span>
          <span>
            最終使用日: {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : '未使用'}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label="削除"
        onClick={() => onDelete(apiKey.id)}
        className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--error)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  )
}
