import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@todo-with-any-ai/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
