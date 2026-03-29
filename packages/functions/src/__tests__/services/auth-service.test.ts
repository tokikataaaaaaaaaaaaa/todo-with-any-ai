import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, isJWT } from '../../services/auth-service'

describe('auth-service', () => {
  describe('generateApiKey', () => {
    it('should return a string of 64 characters', () => {
      const key = generateApiKey()
      expect(key).toHaveLength(64)
    })

    it('should return only hex characters', () => {
      const key = generateApiKey()
      expect(key).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should return a different value each time', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()
      expect(key1).not.toBe(key2)
    })

    it('should generate 100 unique keys', () => {
      const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()))
      expect(keys.size).toBe(100)
    })

    it('should return a string type', () => {
      const key = generateApiKey()
      expect(typeof key).toBe('string')
    })
  })

  describe('hashApiKey', () => {
    it('should return a fixed SHA-256 hash for "test"', () => {
      const hash = hashApiKey('test')
      expect(hash).toBe(
        '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      )
    })

    it('should return the same output for the same input', () => {
      const hash1 = hashApiKey('mykey')
      const hash2 = hashApiKey('mykey')
      expect(hash1).toBe(hash2)
    })

    it('should return different hashes for different inputs', () => {
      const hash1 = hashApiKey('test1')
      const hash2 = hashApiKey('test2')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce a hash for empty string', () => {
      const hash = hashApiKey('')
      expect(hash).toHaveLength(64)
      expect(hash).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      )
    })

    it('should return a 64-character hex string', () => {
      const hash = hashApiKey('anything')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should be deterministic across multiple calls', () => {
      const input = 'deterministic-test'
      const results = Array.from({ length: 10 }, () => hashApiKey(input))
      expect(new Set(results).size).toBe(1)
    })

    it('should handle long input strings', () => {
      const longKey = 'a'.repeat(1000)
      const hash = hashApiKey(longKey)
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle special characters', () => {
      const hash = hashApiKey('!@#$%^&*()')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle unicode input', () => {
      const hash = hashApiKey('日本語テスト')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  describe('isJWT', () => {
    it('should return true for "a.b.c"', () => {
      expect(isJWT('a.b.c')).toBe(true)
    })

    it('should return false for "abc"', () => {
      expect(isJWT('abc')).toBe(false)
    })

    it('should return false for "a.b"', () => {
      expect(isJWT('a.b')).toBe(false)
    })

    it('should return false for "a.b.c.d" (4 parts)', () => {
      expect(isJWT('a.b.c.d')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isJWT('')).toBe(false)
    })

    it('should return true for a realistic JWT-like token', () => {
      const jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature'
      expect(isJWT(jwt)).toBe(true)
    })

    it('should return false for a 64-char hex string (API key format)', () => {
      const apiKey = 'a'.repeat(64)
      expect(isJWT(apiKey)).toBe(false)
    })

    it('should return false for a string with only dots', () => {
      expect(isJWT('..')).toBe(false)
    })

    it('should return true for parts with content separated by dots', () => {
      expect(isJWT('header.payload.signature')).toBe(true)
    })

    it('should return false for single dot', () => {
      expect(isJWT('.')).toBe(false)
    })
  })
})
