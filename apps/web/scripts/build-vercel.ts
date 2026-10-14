/**
 * Post-build packaging for Vercel Build Output API v3.
 *
 * Run AFTER the Vite client build and the vite.server.config.mts server build
 * (which emits .vercel/output/functions/api.func/index.mjs):
 *
 * 1. Copies static assets from build/ -> .vercel/output/static/
 * 2. Writes .vc-config.json and config.json
 *
 * Usage: see vercel.json buildCommand
 */
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_DIR = resolve(ROOT, '.vercel/output')
const STATIC_DIR = resolve(OUTPUT_DIR, 'static')
const FUNC_DIR = resolve(OUTPUT_DIR, 'functions/api.func')

if (!existsSync(resolve(FUNC_DIR, 'index.mjs'))) {
  throw new Error('Server bundle not found at ' + FUNC_DIR + ' (run the vite.server.config.mts build first)')
}

// ── Step 1: Copy Vite build output to static/ ──────────────────────────
console.log('[build-vercel] Copying static assets...')
const buildDir = resolve(ROOT, 'build')
if (!existsSync(buildDir)) {
  throw new Error('Vite build output not found at ' + buildDir)
}
rmSync(STATIC_DIR, { recursive: true, force: true })
cpSync(buildDir, STATIC_DIR, { recursive: true })

// ── Step 2: Write .vc-config.json ───────────────────────────────────────
console.log('[build-vercel] Writing .vc-config.json...')
writeFileSync(
  resolve(FUNC_DIR, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      maxDuration: 30,
    },
    null,
    2,
  ) + '\n',
)

// ── Step 3: Write config.json ───────────────────────────────────────────
console.log('[build-vercel] Writing config.json...')
writeFileSync(
  resolve(OUTPUT_DIR, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Cache-Control headers for static assets (continue: true applies headers without stopping)
        {
          src: '^/index\\.html$',
          headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=30' },
          continue: true,
        },
        {
          src: '^/assets/(.*)$',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        {
          src: '^/fonts/(.*)$',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        {
          src: '^/favicon\\.ico$',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        // API routes -> serverless function
        { src: '^/api(?:/(.*))?$', dest: '/api' },
        // Entry gateway BFF proxy -> serverless function
        { src: '^/entry-gateway(?:/(.*))?$', dest: '/api' },
        // Config proxy (statsig) -> serverless function
        { src: '^/config(?:/(.*))?$', dest: '/api' },
        // Note: no /ws route — Vercel cannot proxy WebSocket connections (neither
        // through functions nor external rewrites). On Vercel, prices use REST
        // polling via the /entry-gateway proxy. WS is only used on CF Workers (staging/prod).
        // Try static files (assets, fonts, favicon, etc.)
        { handle: 'filesystem' },
        // All extensionless paths -> serverless function (SPA + meta tag injection)
        { src: '^/[^.]*$', dest: '/api' },
        // Safety net: if the function is down, serve index.html directly for SPA routes
        { handle: 'miss' },
        { src: '^/[^.]*$', dest: '/index.html', check: true, status: 200 },
      ],
    },
    null,
    2,
  ) + '\n',
)

console.log('[build-vercel] Build complete!')
console.log('[build-vercel] Output: .vercel/output/')
