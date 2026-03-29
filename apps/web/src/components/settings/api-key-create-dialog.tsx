'use client'

import { useState } from 'react'

interface ApiKeyCreateDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<{ key: string }>
}

export function ApiKeyCreateDialog({ open, onClose, onCreate }: ApiKeyCreateDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const nameError = name.length > 100 ? '100文字以内で入力してください' : null
  const canCreate = name.length >= 1 && name.length <= 100 && !creating

  const handleCreate = async () => {
    setCreating(true)
    try {
      const result = await onCreate(name)
      setGeneratedKey(result.key)
      setStep(2)
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setStep(1)
    setName('')
    setGeneratedKey('')
    setCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        {step === 1 ? (
          <>
            <h3 className="mb-4 text-lg font-semibold">APIキーを発行する</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="key-name" className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  キー名
                </label>
                <input
                  id="key-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: Production API Key"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] dark:border-zinc-700 dark:bg-zinc-800"
                />
                {nameError && (
                  <p className="mt-1 text-xs text-red-500">{nameError}</p>
                )}
              </div>
              <button
                type="button"
                disabled={!canCreate}
                onClick={handleCreate}
                className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? '発行中...' : '発行する'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="mb-4 text-lg font-semibold">APIキーが発行されました</h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                このキーは1回のみ表示されます。安全な場所に保管してください。
              </div>
              <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                <code className="font-mono text-sm break-all">{generatedKey}</code>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="コピー"
                  onClick={handleCopy}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {copied ? 'コピーしました' : 'コピー'}
                </button>
                <button
                  type="button"
                  aria-label="閉じる"
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  閉じる
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
