import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Apps import this package from server bundles and from strict app typechecks
// that follow type-only imports too, so its graph must not reach UI, state or
// i18n libraries. Walk the imports of each entry point, type-only included,
// following workspace packages into their source, and pin what leaves.
const PACKAGES_ROOT = resolve(__dirname, '../..')
const IMPORT = /^(?:import|export)\s+[^'"]*?from\s+'([^']+)'/gm

function resolveSource(specifier: string, fromFile: string): string {
  const base = specifier.startsWith('@universe/')
    ? join(PACKAGES_ROOT, specifier.slice('@universe/'.length), 'src/index')
    : join(dirname(fromFile), specifier)
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), base]) {
    try {
      readFileSync(candidate)
      return candidate
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`cannot resolve ${specifier} from ${fromFile}`)
}

function importClosure(entry: string): { files: Set<string>; external: Set<string> } {
  const files = new Set<string>()
  const external = new Set<string>()
  const visit = (file: string): void => {
    if (files.has(file)) {
      return
    }
    files.add(file)
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const specifier = match[1] ?? ''
      if (specifier.startsWith('.') || specifier.startsWith('@universe/')) {
        visit(resolveSource(specifier, file))
      } else {
        external.add(specifier)
      }
    }
  }
  visit(entry)
  return { files, external }
}

function relative(files: Set<string>): string[] {
  return [...files].map((file) => file.slice(PACKAGES_ROOT.length + 1)).sort()
}

describe('import graph', () => {
  it('@universe/logger/server reaches only source-map-js and zod outside the workspace, types included', () => {
    const { files, external } = importClosure(join(__dirname, 'server.ts'))

    expect([...external].sort()).toEqual(['source-map-js', 'zod'])
    expect(relative(files).filter((file) => !file.startsWith('logger/'))).toEqual([
      'privacy/src/email.ts',
      'privacy/src/index.ts',
      'privacy/src/scrub.ts',
      'privacy/src/wallet-secret-keys.json',
    ])
  })

  it('the client-safe root keeps the ingest path and the limiters out of browser bundles', () => {
    const { files, external } = importClosure(join(__dirname, 'index.ts'))

    expect([...external]).toEqual(['source-map-js'])
    expect(relative(files)).toContain('logger/src/logRecord.ts')
    expect(relative(files).filter((file) => file.includes('ingest') || file.includes('rateLimit'))).toEqual([])
  })
})
