import { createApiKeySchema } from '@todo-with-any-ai/shared'
import { generateApiKey, hashApiKey } from './auth-service'

const MAX_API_KEYS = 5

export class ApiKeyService {
  constructor(private db: FirebaseFirestore.Firestore) {}

  private apiKeysCollection(userId: string) {
    return this.db.collection(`users/${userId}/apiKeys`)
  }

  async createApiKey(
    userId: string,
    name: string
  ): Promise<{ key: string; id: string; name: string; createdAt: string }> {
    // Validate name via shared schema
    const parsed = createApiKeySchema.parse({ name })

    // Check limit
    const count = await this.countApiKeys(userId)
    if (count >= MAX_API_KEYS) {
      throw new Error('API key limit reached (max 5)')
    }

    // Generate key and hash
    const plainKey = generateApiKey()
    const keyHash = hashApiKey(plainKey)
    const now = new Date().toISOString()

    const docRef = this.apiKeysCollection(userId).doc()
    await docRef.set({
      keyHash,
      name: parsed.name,
      userId,
      createdAt: now,
      lastUsedAt: null,
    })

    return {
      key: plainKey,
      id: docRef.id,
      name: parsed.name,
      createdAt: now,
    }
  }

  async listApiKeys(
    userId: string
  ): Promise<Array<{ id: string; name: string; createdAt: string; lastUsedAt: string | null }>> {
    const snapshot = await this.apiKeysCollection(userId).get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name as string,
        createdAt: data.createdAt as string,
        lastUsedAt: (data.lastUsedAt as string | null) ?? null,
      }
    })
  }

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    const docRef = this.apiKeysCollection(userId).doc(keyId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return false
    }

    const data = doc.data()
    if (data?.userId !== userId) {
      return false
    }

    await docRef.delete()
    return true
  }

  async verifyApiKey(keyPlaintext: string): Promise<string | null> {
    if (!keyPlaintext) {
      return null
    }

    const keyHash = hashApiKey(keyPlaintext)

    const snapshot = await this.db
      .collectionGroup('apiKeys')
      .where('keyHash', '==', keyHash)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    // Update lastUsedAt
    await doc.ref.update({ lastUsedAt: new Date().toISOString() })

    return data.userId as string
  }

  async countApiKeys(userId: string): Promise<number> {
    const snapshot = await this.apiKeysCollection(userId).get()
    return snapshot.size
  }
}
