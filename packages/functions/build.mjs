import { build } from 'esbuild'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

await build({
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: resolve(__dirname, 'dist/index.js'),
  // firebase-admin and firebase-functions are available in Cloud Functions runtime
  external: ['firebase-admin', 'firebase-functions', 'firebase-admin/*', 'firebase-functions/*'],
  sourcemap: true,
  minify: false,
  // Resolve @todo-with-any-ai/shared to the local source
  alias: {
    '@todo-with-any-ai/shared': resolve(__dirname, '../shared/src/index.ts'),
  },
})

console.log('Build completed: dist/index.js')
