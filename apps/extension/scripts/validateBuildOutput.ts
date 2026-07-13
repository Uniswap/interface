/* oxlint-disable no-console -- CLI script requires console output */
/**
 * Validates extension build output for bundler regressions that only surface in production.
 *
 * Two scans run on every invocation:
 *
 * 1. **Background-only patterns** — checked against `background.js`. These are markers
 *    that the entry-point bundle picked up something it shouldn't have (e.g. Node-only
 *    modules left externalized by Vite, which crash the service worker at boot).
 *
 * 2. **Global patterns** — checked against every emitted `.js` file. Catches
 *    `importScripts(` calls anywhere in the output. Every Web Worker in this extension is
 *    constructed with `{ type: 'module' }`, so `importScripts(` must never appear — its
 *    presence means classic worker chunk loading slipped back in, which fails at runtime
 *    with a doubled `chunks/chunks/<hash>.js` NetworkError when the worker loads sub-chunks.
 *
 * The script understands two layouts via flags:
 *   --prod   apps/extension/.output/chrome-mv3/     (WXT production output)
 *   --dev    apps/extension/.output/chrome-mv3-dev/ (WXT dev output)
 *
 * `WXT_ABSOLUTE_OUTDIR` overrides target detection (used by `start:absolute` workflows).
 * With no flag, both layouts are probed and the first one that exists is scanned.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

const WXT_PROD_DIR = '.output/chrome-mv3'
const WXT_DEV_DIR = '.output/chrome-mv3-dev'

const args = process.argv.slice(2)
const devOnly = args.includes('--dev')
const prodOnly = args.includes('--prod')

const absoluteOutDir = process.env['WXT_ABSOLUTE_OUTDIR']

const dirsToCheck = absoluteOutDir
  ? [absoluteOutDir]
  : devOnly
    ? [WXT_DEV_DIR]
    : prodOnly
      ? [WXT_PROD_DIR]
      : [WXT_DEV_DIR, WXT_PROD_DIR]

const BACKGROUND_SCRIPT = 'background.js'

interface ForbiddenPattern {
  pattern: string
  message: string
}

// Patterns that should never appear in the background entry chunk.
const FORBIDDEN_PATTERNS_BACKGROUND: ForbiddenPattern[] = [
  {
    pattern: '__vite_browser_external',
    message:
      'Node.js module externalization detected in background.js. A dependency is importing Node.js built-ins (like "util", "fs", etc.) that cannot run in the browser. Check recent import changes in background script entry points.',
  },
]

// Patterns that should never appear in ANY emitted .js file.
const FORBIDDEN_PATTERNS_GLOBAL: ForbiddenPattern[] = [
  {
    pattern: 'importScripts(',
    message: [
      'Classic Web Worker chunk loading detected in build output.',
      '',
      'Every Worker in this extension is constructed with `{ type: "module" }`, so the bundler should',
      'never emit `importScripts(<url>)` calls. When this regresses, the worker fails to load split chunks',
      "in production with `NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope'`",
      'because the relative URL resolves to `chrome-extension://<id>/chunks/chunks/<hash>.js` (doubled).',
      '',
      "Fix: ensure apps/extension/wxt.config.ts keeps `vite.worker.format: 'es'`.",
    ].join('\n'),
  },
]

function walkJsFiles(dir: string): string[] {
  const out: string[] = []
  const stack: string[] = [dir]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        out.push(full)
      }
    }
  }
  return out
}

function reportPattern({
  buildDir,
  matches,
  pattern,
  message,
}: {
  buildDir: string
  matches: string[]
  pattern: string
  message: string
}): void {
  console.error('\n❌ BUILD VALIDATION FAILED')
  console.error(`Forbidden pattern in ${path.relative(process.cwd(), buildDir) || buildDir}: "${pattern}"`)
  console.error('\nMatched files:')
  for (const file of matches) {
    console.error(`  • ${path.relative(buildDir, file)}`)
  }
  console.error(`\n${message}\n`)
}

function validateBuild(): boolean {
  let buildDir: string | null = null

  for (const dir of dirsToCheck) {
    const fullPath = path.isAbsolute(dir) ? dir : path.join(__dirname, '..', dir)
    if (fs.existsSync(fullPath)) {
      buildDir = fullPath
      break
    }
  }

  if (!buildDir) {
    console.error('No build output found. Run `bun build:wxt` first.')
    process.exit(1)
  }

  let hasErrors = false

  // Background-script scan
  const backgroundPath = path.join(buildDir, BACKGROUND_SCRIPT)
  if (!fs.existsSync(backgroundPath)) {
    console.error(`Background script not found at ${backgroundPath}`)
    process.exit(1)
  }

  const backgroundContent = fs.readFileSync(backgroundPath, 'utf-8')
  for (const { pattern, message } of FORBIDDEN_PATTERNS_BACKGROUND) {
    if (backgroundContent.includes(pattern)) {
      reportPattern({ buildDir, matches: [backgroundPath], pattern, message })
      hasErrors = true
    }
  }

  // Global scan across every emitted .js file.
  const allJsFiles = walkJsFiles(buildDir)
  for (const { pattern, message } of FORBIDDEN_PATTERNS_GLOBAL) {
    const matches: string[] = []
    for (const file of allJsFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes(pattern)) {
        matches.push(file)
      }
    }
    if (matches.length > 0) {
      reportPattern({ buildDir, matches, pattern, message })
      hasErrors = true
    }
  }

  if (hasErrors) {
    process.exit(1)
  }

  console.log(
    `✅ Build validation passed (${allJsFiles.length} JS files scanned in ${path.relative(process.cwd(), buildDir) || buildDir})`,
  )
  return true
}

validateBuild()
