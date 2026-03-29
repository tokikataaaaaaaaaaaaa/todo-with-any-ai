import { auth } from '@/lib/firebase'
import type { ApiKey } from '@todo-with-any-ai/shared'

async function getAuthToken(): Promise<string> {
  if (!auth?.currentUser) {
    throw new Error('Not authenticated')
  }
  return auth.currentUser.getIdToken()
}

export const apiKeysClient = {
  async listKeys(): Promise<ApiKey[]> {
    const token = await getAuthToken()
    const res = await fetch('/api/keys', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(`Failed to list keys: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    return data.keys
  },

  async createKey(name: string): Promise<{ key: string; id: string; name: string; createdAt: string }> {
    const token = await getAuthToken()
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      throw new Error(`Failed to create key: ${res.status} ${res.statusText}`)
    }
    return res.json()
  },

  async deleteKey(id: string): Promise<void> {
    const token = await getAuthToken()
    const res = await fetch(`/api/keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(`Failed to delete key: ${res.status} ${res.statusText}`)
    }
  },
}
