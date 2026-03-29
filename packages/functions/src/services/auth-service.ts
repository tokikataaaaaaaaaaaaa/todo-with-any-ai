import crypto from 'crypto'

/**
 * Generate a random 64-character hex API key.
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash an API key with SHA-256 for secure storage.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Determine if a token looks like a JWT (3 dot-separated parts, each non-empty).
 */
export function isJWT(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3 && parts.every((part) => part.length > 0)
}
