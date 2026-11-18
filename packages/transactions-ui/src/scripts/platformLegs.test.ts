/**
 * Contract for platform legs: every `<name>.{native,web,ios,android}.ts(x)` under src/ sits next
 * to a base `<name>.ts(x)` and exports the same runtime names. tsc and the generated index read
 * only the base, so a leg that drops or adds an export goes unnoticed until a bundler picks it.
 * Types live in the base (legs import them from it), so a leg may leave them out, but it never
 * exports a name the base lacks.
 *
 * Dependency-free, with the declaration regex generateIndex.ts uses.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { DECLARATION, UNSUPPORTED } from '@universe/transactions-ui/src/scripts/generateIndex'
import { afterEach, describe, expect, it } from 'vitest'

const SRC_DIR = join(__dirname, '..')
const LEG = /^(.+)\.(?:native|web|ios|android)\.tsx?$/

interface DeclaredExports {
  values: Set<string>
  types: Set<string>
}

function listFiles(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((entry) => {
      const path = join(dir, entry)
      return statSync(path).isDirectory() ? listFiles(path) : [path]
    })
}

function toPosix(srcDir: string, path: string): string {
  return relative(srcDir, path).split(sep).join('/')
}

function listLegs(srcDir: string): string[] {
  return listFiles(srcDir).filter((path) => LEG.test(path))
}

function parseExports(srcDir: string, path: string): DeclaredExports {
  const values = new Set<string>()
  const types = new Set<string>()
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (UNSUPPORTED.test(line)) {
        throw new Error(`${toPosix(srcDir, path)}:${index + 1}: export at the declaration`)
      }
      const match = DECLARATION.exec(line)
      if (!match?.[1] || !match[2]) {
        return
      }
      const names = match[1] === 'interface' || match[1] === 'type' ? types : values
      names.add(match[2])
    })
  return { values, types }
}

/** One message per broken leg export. Empty when every leg matches its base. */
function legMismatches(srcDir: string): string[] {
  return listLegs(srcDir).flatMap((path) => {
    const leg = toPosix(srcDir, path)
    const stem = LEG.exec(path)?.[1] ?? ''
    const basePath = [`${stem}.ts`, `${stem}.tsx`].find((candidate) => existsSync(candidate))
    if (!basePath) {
      return [`${leg} has no base file`]
    }
    const base = parseExports(srcDir, basePath)
    const own = parseExports(srcDir, path)
    const missing = [...base.values].filter((name) => !own.values.has(name))
    const extra = [
      ...[...own.values].filter((name) => !base.values.has(name)),
      ...[...own.types].filter((name) => !base.types.has(name) && !base.values.has(name)),
    ]
    return [
      ...missing.map((name) => `${leg} does not export ${name}`),
      ...extra.map((name) => `${leg} exports ${name}, which its base does not`),
    ]
  })
}

describe('platform legs in src', () => {
  it('finds the legs it checks', () => {
    expect(listLegs(SRC_DIR).map((path) => toPosix(SRC_DIR, path))).toContain(
      'common/ErrorView/errorViewStyles.native.ts',
    )
  })

  it('export the same runtime names as their base file', () => {
    expect(legMismatches(SRC_DIR)).toEqual([])
  })
})

describe('legMismatches', () => {
  let root: string | undefined

  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true })
    }
    root = undefined
  })

  function fixture(files: Record<string, string>): string {
    root = mkdtempSync(join(tmpdir(), 'transactions-ui-legs-'))
    for (const [path, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), source)
    }
    return root
  }

  it('accepts a leg that exports the base runtime names and leaves the types to the base', () => {
    const srcDir = fixture({
      'common/Row/rowStyles.ts': 'export interface RowStyles {}\nexport const ROW_STYLES = {}\n',
      'common/Row/rowStyles.native.ts': "import type { RowStyles } from './rowStyles'\nexport const ROW_STYLES = {}\n",
    })
    expect(legMismatches(srcDir)).toEqual([])
  })

  it('reports a missing export, an extra export and a leg without a base', () => {
    const srcDir = fixture({
      'common/Row/Row.tsx': 'export function Row(): null {\n  return null\n}\nexport const ROW_HEIGHT = 1\n',
      'common/Row/Row.web.tsx': 'export function Row(): null {\n  return null\n}\nexport type WebOnly = string\n',
      'swap/Gas/gasStyles.ios.ts': 'export const GAS_STYLES = {}\n',
    })
    expect(legMismatches(srcDir)).toEqual([
      'common/Row/Row.web.tsx does not export ROW_HEIGHT',
      'common/Row/Row.web.tsx exports WebOnly, which its base does not',
      'swap/Gas/gasStyles.ios.ts has no base file',
    ])
  })

  it('rejects a re-export in a leg, which the regex cannot read', () => {
    const srcDir = fixture({
      'common/Row/Row.tsx': 'export const Row = 1\n',
      'common/Row/Row.android.tsx': "export { Row } from './RowImpl'\n",
    })
    expect(() => legMismatches(srcDir)).toThrow(/Row\.android\.tsx:1: export at the declaration/)
  })
})
