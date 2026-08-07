/// <reference types="bun" />

// Post-build packaging for the ECS target: bundles functions/ecs-entry.ts into
// build/server/index.mjs next to the Vite client output in build/client/.
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { copyOgAssets, inlineAssetPlugin, tsconfigPathsPlugin } from './bun-server-build'

const ROOT = resolve(import.meta.dirname, '..')
const SERVER_DIR = resolve(ROOT, 'build/server')

const clientDir = resolve(ROOT, 'build/client')
if (!existsSync(resolve(clientDir, 'index.html'))) {
  throw new Error('Vite client build output not found at ' + clientDir + ' (run the ecs vite build first)')
}

console.log('[build-ecs] Bundling server...')
mkdirSync(SERVER_DIR, { recursive: true })

const entryPoint = resolve(ROOT, 'functions/ecs-entry.ts')
if (!existsSync(entryPoint)) {
  throw new Error('Server entry point not found at ' + entryPoint)
}

const bundleResult = await Bun.build({
  entrypoints: [entryPoint],
  outdir: SERVER_DIR,
  naming: 'index.mjs',
  target: 'node',
  format: 'esm',
  plugins: [tsconfigPathsPlugin, inlineAssetPlugin],
})

if (!bundleResult.success) {
  console.error('[build-ecs] Bundle errors:')
  for (const log of bundleResult.logs) {
    console.error(log)
  }
  throw new Error('Failed to bundle server')
}

console.log('[build-ecs] Server bundled to build/server/index.mjs')

copyOgAssets(SERVER_DIR)
console.log('[build-ecs] Copied @vercel/og runtime assets')

console.log('[build-ecs] Build complete! Output: build/client/ + build/server/')
