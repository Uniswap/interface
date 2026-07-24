/* oxlint-disable no-console -- CI check script */
// Fails the build when the gzipped entry chunk(s) exceed the budget.
// Reads the built output directly, so it works with sourcemaps disabled.
// Requires a completed client build (build/client). Run via `bun run check:bundle-size`.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// Current entry chunk is ~2,749 KB gzipped (2026-07). Ratchet this budget down
// as entry-size reductions land.
const ENTRY_GZIP_BUDGET_BYTES = 2_850_000

const GZIP_LEVEL = 9

const clientDir = join(import.meta.dirname, '..', 'build', 'client')

function parseEntryScriptPaths(html: string): string[] {
  const scriptTags = html.match(/<script\b[^>]*>/g) ?? []
  return scriptTags
    .filter((tag) => tag.includes('type="module"'))
    .map((tag) => /\bsrc="([^"]+)"/.exec(tag)?.[1])
    .filter((src): src is string => src !== undefined && src.startsWith('/assets/') && src.endsWith('.js'))
}

function kb(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB`
}

function main(): void {
  let html: string
  try {
    html = readFileSync(join(clientDir, 'index.html'), 'utf-8')
  } catch {
    console.error(`Missing ${clientDir}/index.html — run a client build first (e.g. bun run build:staging).`)
    process.exit(1)
  }

  const entryPaths = parseEntryScriptPaths(html)
  if (entryPaths.length === 0) {
    console.error('No module entry scripts under /assets/ found in build/client/index.html.')
    console.error('The build output layout may have changed — update scripts/check-bundle-size.ts.')
    process.exit(1)
  }

  let totalGzipBytes = 0
  for (const entryPath of entryPaths) {
    const contents = readFileSync(join(clientDir, entryPath))
    const gzipBytes = gzipSync(contents, { level: GZIP_LEVEL }).byteLength
    totalGzipBytes += gzipBytes
    console.info(`${entryPath}: ${kb(gzipBytes)} gzip`)
  }

  console.info(`Entry total: ${kb(totalGzipBytes)} gzip (budget: ${kb(ENTRY_GZIP_BUDGET_BYTES)})`)

  if (totalGzipBytes > ENTRY_GZIP_BUDGET_BYTES) {
    console.error(
      `Entry bundle is over budget by ${kb(totalGzipBytes - ENTRY_GZIP_BUDGET_BYTES)}. ` +
        'Reduce entry-chunk weight (lazy-load, dedupe, or drop dependencies) rather than raising the budget.',
    )
    process.exit(1)
  }

  console.info('Entry bundle is within budget.')
}

main()
