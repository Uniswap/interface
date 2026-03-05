/**
 * Post-build packaging for Vercel Build Output API v3.
 *
 * Run AFTER the Vite SPA build (via NX in vercel.json buildCommand).
 *
 * 1. Creates .vercel/output/ directory structure
 * 2. Copies static assets from build/ -> .vercel/output/static/
 * 3. Bundles the Hono serverless function -> .vercel/output/functions/api.func/index.mjs
 * 4. Writes .vc-config.json and config.json
 *
 * Usage: see vercel.json buildCommand
 */
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_DIR = resolve(ROOT, '.vercel/output')
const STATIC_DIR = resolve(OUTPUT_DIR, 'static')
const FUNC_DIR = resolve(OUTPUT_DIR, 'functions/api.func')

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}

function resolveWithExtensions(basePath: string): string {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs']
  // Try exact path first (must be a file, not a directory)
  if (isFile(basePath)) {
    return basePath
  }
  for (const ext of extensions) {
    if (isFile(basePath + ext)) {
      return basePath + ext
    }
  }
  for (const ext of extensions) {
    if (isFile(basePath + '/index' + ext)) {
      return basePath + '/index' + ext
    }
  }
  return basePath
}

// Resolve path aliases since bun build doesn't read tsconfig paths.
// ~/* -> src/*,  functions/* -> functions/*
const tsconfigPathsPlugin: BunPlugin = {
  name: 'tsconfig-paths',
  setup(build) {
    build.onResolve({ filter: /^~\// }, (args) => {
      const suffix = args.path.slice(2)
      return { path: resolveWithExtensions(resolve(ROOT, 'src', suffix)) }
    })
    build.onResolve({ filter: /^functions\// }, (args) => {
      const suffix = args.path.slice('functions/'.length)
      return { path: resolveWithExtensions(resolve(ROOT, 'functions', suffix)) }
    })
  },
}

// ── Step 1: Clean and create output directory ───────────────────────────
console.log('[build-vercel] Creating .vercel/output/ directory structure...')
if (existsSync(OUTPUT_DIR)) {
  rmSync(OUTPUT_DIR, { recursive: true })
}
mkdirSync(FUNC_DIR, { recursive: true })

// ── Step 2: Copy Vite build output to static/ ──────────────────────────
console.log('[build-vercel] Copying static assets...')
const buildDir = resolve(ROOT, 'build')
if (!existsSync(buildDir)) {
  throw new Error('Vite build output not found at ' + buildDir)
}
cpSync(buildDir, STATIC_DIR, { recursive: true })

// ── Step 3: Bundle the Hono serverless function ─────────────────────────
console.log('[build-vercel] Bundling serverless function...')
const entryPoint = resolve(ROOT, 'functions/vercel-entry.ts')
if (!existsSync(entryPoint)) {
  throw new Error('Serverless function entry point not found at ' + entryPoint)
}

const bundleResult = await Bun.build({
  entrypoints: [entryPoint],
  outdir: FUNC_DIR,
  naming: 'index.mjs',
  target: 'node',
  format: 'esm',
  plugins: [tsconfigPathsPlugin],
})

if (!bundleResult.success) {
  console.error('[build-vercel] Bundle errors:')
  for (const log of bundleResult.logs) {
    console.error(log)
  }
  throw new Error('Failed to bundle serverless function')
}

console.log('[build-vercel] Serverless function bundled successfully')

// ── Step 3b: Copy @vercel/og runtime assets ─────────────────────────────
// @vercel/og uses readFileSync(import.meta.url + '/../<file>') at module load
// for its font, layout engine (yoga), and SVG renderer (resvg). Since we bundle
// into a single .mjs, these files must sit alongside it.
const ogAssets = ['noto-sans-v27-latin-regular.ttf', 'yoga.wasm', 'resvg.wasm']
const ogDistDir = resolve(ROOT, '../../node_modules/@vercel/og/dist')
for (const asset of ogAssets) {
  const src = resolve(ogDistDir, asset)
  if (existsSync(src)) {
    cpSync(src, resolve(FUNC_DIR, asset))
  } else {
    console.warn(`[build-vercel] Warning: @vercel/og asset not found: ${src}`)
  }
}
console.log('[build-vercel] Copied @vercel/og runtime assets')

// ── Step 4: Write .vc-config.json ───────────────────────────────────────
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

// ── Step 5: Write config.json ───────────────────────────────────────────
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
