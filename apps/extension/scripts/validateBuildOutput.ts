/** biome-ignore-all lint/suspicious/noConsole: CLI script requires console output */
/**
 * Validates extension build output for common issues.
 *
 * Checks for:
 * - __vite_browser_external markers (indicates Node.js modules were externalized)
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

const BUILD_DIRS = [
  '.output/chrome-mv3-dev', // dev build (bun extension start)
  '.output/chrome-mv3', // production build (bun extension build:production)
]

// Can be overridden via CLI arg: --dev or --prod
const args = process.argv.slice(2)
const devOnly = args.includes('--dev')
const prodOnly = args.includes('--prod')

// Support WXT_ABSOLUTE_OUTDIR for absolute path builds (e.g., bun extension start:absolute)
const absoluteOutDir = process.env['WXT_ABSOLUTE_OUTDIR']

const dirsToCheck = absoluteOutDir
  ? [absoluteOutDir]
  : devOnly
    ? ['.output/chrome-mv3-dev']
    : prodOnly
      ? ['.output/chrome-mv3']
      : BUILD_DIRS

const BACKGROUND_SCRIPT = 'background.js'

// Patterns that indicate problematic externalization
const FORBIDDEN_PATTERNS = [
  {
    pattern: '__vite_browser_external',
    message:
      'Node.js module externalization detected. A dependency is importing Node.js built-ins (like "util", "fs", etc.) that cannot run in the browser. Check recent import changes in background script entry points.',
  },
]

function validateBuild(): boolean {
  let buildDir: string | null = null

  // Find existing build directory
  for (const dir of dirsToCheck) {
    // For absolute paths, use directly; for relative paths, resolve from project root
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

  const backgroundPath = path.join(buildDir, BACKGROUND_SCRIPT)

  if (!fs.existsSync(backgroundPath)) {
    console.error(`Background script not found at ${backgroundPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(backgroundPath, 'utf-8')
  let hasErrors = false

  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (content.includes(pattern)) {
      console.error(`\n❌ BUILD VALIDATION FAILED`)
      console.error(`Pattern found: "${pattern}"`)
      console.error(`\n${message}\n`)
      hasErrors = true
    }
  }

  if (hasErrors) {
    process.exit(1)
  }

  console.log('✅ Build validation passed')
  return true
}

validateBuild()
