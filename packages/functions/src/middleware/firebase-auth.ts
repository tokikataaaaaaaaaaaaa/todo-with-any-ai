import { createMiddleware } from 'hono/factory'
import { getAuth } from 'firebase-admin/auth'
import { db } from '../lib/firebase'
import { isJWT, hashApiKey } from '../services/auth-service'

type Env = {
  Variables: {
    userId: string
  }
}

/**
 * Authentication middleware supporting two schemes:
 * 1. Firebase ID Token (JWT) for web clients
 * 2. API Key (64-char hex) for MCP/external tools
 */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (isJWT(token)) {
    // Firebase ID Token verification
    try {
      const decoded = await getAuth().verifyIdToken(token)
      c.set('userId', decoded.uid)
    } catch {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  } else {
    // API key verification via Firestore
    try {
      const hashed = hashApiKey(token)
      const snapshot = await db
        .collection('api_keys')
        .where('hashedKey', '==', hashed)
        .limit(1)
        .get()

      if (snapshot.empty) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const userId = snapshot.docs[0].data().userId
      c.set('userId', userId)
    } catch {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  }

  await next()
})
