/* oxlint-disable no-console -- CLI script requires console output */
/**
 * Diffs the webpack build output (`build/`) against the WXT build output (`.output/chrome-mv3/`)
 * and reports any structural differences. Used during the WXT migration to confirm functional
 * parity before cutting over CI/CD.
 *
 * Reports:
 * - Manifest field-by-field diff (ignores content_script order / script path flavor differences).
 * - File presence diff (scripts only — asset hashing differs by design).
 * - Entrypoint bundle size diff (background, sidebar, popup, onboarding, unitag, injected, ethereum).
 *
 * Exit code 0 when no blocking diffs are present; 1 when the manifest or file presence diff
 * is not empty. Size regressions are reported but don't fail the run (noisy during iteration).
 *
 * Usage:
 *   bun run scripts/diffBuilds.ts
 *   bun run scripts/diffBuilds.ts --webpack-dir=build --wxt-dir=.output/chrome-mv3
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

// -----------------------------------------------------------------------------
// Args
// -----------------------------------------------------------------------------

type Args = { webpackDir: string; wxtDir: string }

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const getFlag = (name: string, fallback: string): string => {
    const match = args.find((a) => a.startsWith(`--${name}=`))
    return match ? match.slice(name.length + 3) : fallback
  }
  return {
    webpackDir: path.resolve(__dirname, '..', getFlag('webpack-dir', 'build')),
    wxtDir: path.resolve(__dirname, '..', getFlag('wxt-dir', '.output/chrome-mv3')),
  }
}

// -----------------------------------------------------------------------------
// Manifest diff
// -----------------------------------------------------------------------------

type Manifest = {
  manifest_version: number
  name: string
  description?: string
  version: string
  permissions?: string[]
  host_permissions?: string[]
  externally_connectable?: { ids?: string[]; matches?: string[] }
  content_scripts?: ContentScript[]
  background?: { service_worker?: string; type?: string }
  side_panel?: { default_path?: string }
  commands?: Record<string, unknown>
  minimum_chrome_version?: string
  action?: Record<string, unknown>
  icons?: Record<string, string>
}

type ContentScript = {
  id?: string
  matches?: string[]
  js?: string[]
  run_at?: string
  world?: string
  all_frames?: boolean
}

function readManifest(dir: string): Manifest {
  const manifestPath = path.join(dir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No manifest at ${manifestPath}`)
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
}

/**
 * WXT emits content scripts to `content-scripts/<name>.js`, webpack emits to `<name>.js`.
 * Normalize to just the basename so we can compare by identity.
 */
function normalizeContentScriptJs(js: string[] | undefined): string[] {
  return (js ?? []).map((p) => path.basename(p))
}

function normalizeContentScripts(scripts: ContentScript[] | undefined): ContentScript[] {
  const normalized = (scripts ?? []).map((cs) => ({
    id: cs.id,
    matches: [...(cs.matches ?? [])].sort(),
    js: normalizeContentScriptJs(cs.js),
    run_at: cs.run_at,
    world: cs.world ?? 'ISOLATED',
    all_frames: cs.all_frames ?? false,
  }))
  // Sort by id (or js filename as fallback) so order doesn't matter.
  return normalized.sort((a, b) => (a.id ?? a.js[0] ?? '').localeCompare(b.id ?? b.js[0] ?? ''))
}

type Diff = { path: string; webpack: unknown; wxt: unknown }

/** Recursively sort object keys so JSON.stringify produces a stable output regardless of key order. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[k] = sortKeys((value as Record<string, unknown>)[k])
    }
    return sorted
  }
  return value
}

function diffManifests(w: Manifest, x: Manifest): Diff[] {
  const diffs: Diff[] = []

  const simpleFields: (keyof Manifest)[] = [
    'manifest_version',
    'name',
    'description',
    'version',
    'minimum_chrome_version',
  ]
  for (const field of simpleFields) {
    if (JSON.stringify(w[field]) !== JSON.stringify(x[field])) {
      diffs.push({ path: field, webpack: w[field], wxt: x[field] })
    }
  }

  // Sort array fields before comparing
  const arrayFields: (keyof Manifest)[] = ['permissions', 'host_permissions']
  for (const field of arrayFields) {
    const wv = [...((w[field] as string[] | undefined) ?? [])].sort()
    const xv = [...((x[field] as string[] | undefined) ?? [])].sort()
    if (JSON.stringify(wv) !== JSON.stringify(xv)) {
      diffs.push({ path: field, webpack: wv, wxt: xv })
    }
  }

  // Nested objects
  const nested: (keyof Manifest)[] = ['background', 'side_panel', 'icons', 'action', 'commands']
  for (const field of nested) {
    if (JSON.stringify(sortKeys(w[field])) !== JSON.stringify(sortKeys(x[field]))) {
      diffs.push({ path: field, webpack: w[field], wxt: x[field] })
    }
  }

  // externally_connectable: sort the matches array
  const wExt = w.externally_connectable
    ? { ids: [...(w.externally_connectable.ids ?? [])], matches: [...(w.externally_connectable.matches ?? [])].sort() }
    : undefined
  const xExt = x.externally_connectable
    ? { ids: [...(x.externally_connectable.ids ?? [])], matches: [...(x.externally_connectable.matches ?? [])].sort() }
    : undefined
  if (JSON.stringify(wExt) !== JSON.stringify(xExt)) {
    diffs.push({ path: 'externally_connectable', webpack: wExt, wxt: xExt })
  }

  // content_scripts: normalize js paths, sort entries, compare
  const wCS = normalizeContentScripts(w.content_scripts)
  const xCS = normalizeContentScripts(x.content_scripts)
  if (JSON.stringify(wCS) !== JSON.stringify(xCS)) {
    diffs.push({ path: 'content_scripts', webpack: wCS, wxt: xCS })
  }

  return diffs
}

// -----------------------------------------------------------------------------
// File presence diff (scripts only)
// -----------------------------------------------------------------------------

/**
 * Scripts we expect to see in both outputs. Asset filenames are hashed in WXT and
 * not in webpack, so comparing by name would be noisy; we only check scripts.
 */
const EXPECTED_SCRIPTS = [
  'background.js',
  'sidepanel.js',
  'onboarding.js',
  'fallback-popup.js',
  'unitagClaim.js',
  'injected.js',
  'ethereum.js',
]

/**
 * Webpack uses: background.js, sidebar.js, onboarding.js, popup.js, unitagClaim.js, injected.js, ethereum.js
 * WXT uses:     background.js, sidepanel.js, onboarding.js, fallback-popup.js, unitagClaim.js,
 *               content-scripts/injected.js, content-scripts/ethereum.js (as <html>.js for UI entries)
 *
 * Instead of building an exact map, just check that each logical surface produced some kind of
 * bundle with an HTML shell (for UI) or a JS entry (for background/content-scripts).
 */
type SurfaceCheck = {
  name: string
  webpackFiles: string[]
  wxtFiles: string[]
}

const SURFACES: SurfaceCheck[] = [
  { name: 'background', webpackFiles: ['background.js'], wxtFiles: ['background.js'] },
  { name: 'sidepanel', webpackFiles: ['sidebar.js', 'sidepanel.html'], wxtFiles: ['sidepanel.html'] },
  { name: 'onboarding', webpackFiles: ['onboarding.js', 'onboarding.html'], wxtFiles: ['onboarding.html'] },
  { name: 'fallback-popup', webpackFiles: ['popup.js', 'fallback-popup.html'], wxtFiles: ['fallback-popup.html'] },
  { name: 'unitagClaim', webpackFiles: ['unitagClaim.js', 'unitagClaim.html'], wxtFiles: ['unitagClaim.html'] },
  { name: 'injected', webpackFiles: ['injected.js'], wxtFiles: ['content-scripts/injected.js'] },
  { name: 'ethereum', webpackFiles: ['ethereum.js'], wxtFiles: ['content-scripts/ethereum.js'] },
]

function checkSurfaces(webpackDir: string, wxtDir: string): { missing: string[] } {
  const missing: string[] = []
  for (const s of SURFACES) {
    for (const f of s.webpackFiles) {
      if (!fs.existsSync(path.join(webpackDir, f))) {
        missing.push(`webpack:${s.name}:${f}`)
      }
    }
    for (const f of s.wxtFiles) {
      if (!fs.existsSync(path.join(wxtDir, f))) {
        missing.push(`wxt:${s.name}:${f}`)
      }
    }
  }
  return { missing }
}

// -----------------------------------------------------------------------------
// Bundle size diff (entrypoints only)
// -----------------------------------------------------------------------------

/**
 * For the 7 logical surfaces, sum the bytes of the entrypoint JS (for background, content scripts)
 * or the HTML + all referenced JS (for UI pages). WXT splits UI entries into chunks/, so we read
 * the HTML and sum the sizes of every <script src> it references.
 */
function readHtmlScriptRefs(htmlPath: string): string[] {
  if (!fs.existsSync(htmlPath)) return []
  const html = fs.readFileSync(htmlPath, 'utf-8')
  const matches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
  return matches.map((m) => m[1]).filter((src): src is string => src !== undefined)
}

function safeStatSize(p: string): number {
  try {
    return fs.statSync(p).size
  } catch {
    return 0
  }
}

/**
 * Walk a directory recursively and sum sizes of files matching the extension filter.
 * Used for total-output size and category-specific (scripts-only) size.
 */
function walkSize(dir: string, filter: (p: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0
  let total = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      total += walkSize(full, filter)
    } else if (filter(full)) {
      total += safeStatSize(full)
    }
  }
  return total
}

const ALL_FILES = () => true
const SCRIPTS_ONLY = (p: string) => p.endsWith('.js')
const ASSETS_ONLY = (p: string) =>
  !p.endsWith('.js') &&
  !p.endsWith('.html') &&
  !p.endsWith('.map') &&
  !p.endsWith('.json') &&
  !p.endsWith('.LICENSE.txt')

// -----------------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

function main(): void {
  const { webpackDir, wxtDir } = parseArgs()

  console.log(`Comparing webpack output: ${webpackDir}`)
  console.log(`           against WXT output: ${wxtDir}\n`)

  if (!fs.existsSync(webpackDir)) {
    console.error(`❌ Webpack output dir does not exist: ${webpackDir}`)
    process.exit(1)
  }
  if (!fs.existsSync(wxtDir)) {
    console.error(`❌ WXT output dir does not exist: ${wxtDir}`)
    process.exit(1)
  }

  // --- Manifest ---
  const webpackManifest = readManifest(webpackDir)
  const wxtManifest = readManifest(wxtDir)
  const manifestDiffs = diffManifests(webpackManifest, wxtManifest)

  console.log('=== Manifest diff ===')
  if (manifestDiffs.length === 0) {
    console.log('  ✅ No structural differences.\n')
  } else {
    for (const d of manifestDiffs) {
      console.log(`  ❗ ${d.path}`)
      console.log(`       webpack: ${JSON.stringify(d.webpack)}`)
      console.log(`       wxt:     ${JSON.stringify(d.wxt)}`)
    }
    console.log('')
  }

  // --- File presence ---
  const { missing } = checkSurfaces(webpackDir, wxtDir)
  console.log('=== Surface presence ===')
  if (missing.length === 0) {
    console.log('  ✅ All 7 surfaces present in both outputs.\n')
  } else {
    for (const m of missing) {
      console.log(`  ❌ missing: ${m}`)
    }
    console.log('')
  }

  // --- Total output sizes (what the user installs) ---
  console.log('=== Total output size ===')
  const categories = [
    { name: 'all', filter: ALL_FILES },
    { name: 'scripts', filter: SCRIPTS_ONLY },
    { name: 'assets', filter: ASSETS_ONLY },
  ] as const
  console.log('  category       webpack        wxt           delta')
  for (const c of categories) {
    const w = walkSize(webpackDir, c.filter)
    const x = walkSize(wxtDir, c.filter)
    const pct = w === 0 ? '—' : `${(((x - w) / w) * 100).toFixed(1)}%`
    console.log(`  ${c.name.padEnd(14)} ${formatBytes(w).padEnd(14)} ${formatBytes(x).padEnd(14)} ${pct}`)
  }
  console.log('')

  // --- Content script sizes (these ship on every page, so keep them tight) ---
  console.log('=== Content script sizes ===')
  const csScripts = [
    { name: 'injected', webpack: 'injected.js', wxt: 'content-scripts/injected.js' },
    { name: 'ethereum', webpack: 'ethereum.js', wxt: 'content-scripts/ethereum.js' },
  ]
  for (const s of csScripts) {
    const w = safeStatSize(path.join(webpackDir, s.webpack))
    const x = safeStatSize(path.join(wxtDir, s.wxt))
    const pct = w === 0 ? '—' : `${(((x - w) / w) * 100).toFixed(1)}%`
    console.log(`  ${s.name.padEnd(14)} ${formatBytes(w).padEnd(14)} ${formatBytes(x).padEnd(14)} ${pct}`)
  }
  console.log('')

  const hasBlockingDiffs = manifestDiffs.length > 0 || missing.length > 0
  if (hasBlockingDiffs) {
    console.error('❌ Parity diff detected — see report above.')
    process.exit(1)
  }
  console.log('✅ Parity check passed.')
}

main()
