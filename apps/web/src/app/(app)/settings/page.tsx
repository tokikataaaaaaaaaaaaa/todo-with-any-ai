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
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">設定</h1>
      </div>

      {/* API Keys Section */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold">API Keys</h2>

        {loading && (
          <div data-testid="api-keys-loading" className="space-y-3">
            <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && keys.length === 0 && !error && (
          <p className="mb-4 text-sm text-zinc-500">APIキーがありません</p>
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
          className="w-full rounded-lg border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] dark:border-zinc-700 dark:text-zinc-400"
        >
          + APIキーを発行する
        </button>
      </section>

      {/* Account Section */}
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="mb-4 text-base font-semibold">アカウント</h2>
        <div className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user?.email ?? 'unknown'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
