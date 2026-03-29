'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useApiKeyStore } from '@/stores/api-key-store'
import { ApiKeyCard } from '@/components/settings/api-key-card'
import { ApiKeyCreateDialog } from '@/components/settings/api-key-create-dialog'

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const keys = useApiKeyStore((s) => s.keys) ?? []
  const loading = useApiKeyStore((s) => s.loading)
  const error = useApiKeyStore((s) => s.error)
  const fetchKeys = useApiKeyStore((s) => s.fetchKeys)
  const createKey = useApiKeyStore((s) => s.createKey)
  const deleteKey = useApiKeyStore((s) => s.deleteKey)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreate = async (name: string) => {
    const result = await createKey(name)
    return result
  }

  const handleDelete = async (id: string) => {
    await deleteKey(id)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          aria-label="戻る"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>設定</h1>
      </div>

      {/* API Keys Section */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold">API Keys</h2>

        {loading && (
          <div data-testid="api-keys-loading" className="space-y-3">
            <div className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-raised)]" />
            <div className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-raised)]" />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[var(--radius-lg)] bg-[var(--accent-light)] p-3 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {!loading && keys.length === 0 && !error && (
          <p className="mb-4 text-sm text-[var(--text-muted)]">APIキーがありません</p>
        )}

        {!loading && keys.length > 0 && (
          <div className="mb-4 space-y-3">
            {keys.map((apiKey) => (
              <ApiKeyCard key={apiKey.id} apiKey={apiKey} onDelete={handleDelete} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="w-full rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          + APIキーを発行する
        </button>
      </section>

      {/* Account Section */}
      <section className="border-t border-[var(--border)] pt-6">
        <h2 className="mb-4 text-base font-semibold">アカウント</h2>
        <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {user?.email ?? 'unknown'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-raised)]"
        >
          ログアウト
        </button>
      </section>

      {/* Create Dialog */}
      <ApiKeyCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
