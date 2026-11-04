import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { buildIndex, normalizeIndex } from '@universe/transactions-ui/src/scripts/generateIndex'
import { afterEach, describe, expect, it } from 'vitest'

const SRC_DIR = join(__dirname, '..')

describe('src/index.ts', () => {
  it('matches the generator output (run `bun transactions-ui generate:index` after adding or renaming a view)', () => {
    const onDisk = readFileSync(join(SRC_DIR, 'index.ts'), 'utf8')
    expect(normalizeIndex(onDisk)).toBe(normalizeIndex(buildIndex(SRC_DIR)))
  })
})

describe('generateIndex', () => {
  let root: string | undefined

  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true })
    }
    root = undefined
  })

  function fixture(files: Record<string, string>): string {
    root = mkdtempSync(join(tmpdir(), 'transactions-ui-index-'))
    for (const [path, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), source)
    }
    return root
  }

  it('indexes values and types, and skips legs, stories, tests and @internal declarations', () => {
    const srcDir = fixture({
      'common/Row/Row.tsx': 'export interface RowProps {}\nexport function Row(): null {\n  return null\n}\n',
      'common/Row/Row.native.tsx': 'export function Row(): null {\n  return null\n}\n',
      'common/Row/Row.stories.tsx': 'export const Default = {}\n',
      'common/Row/rowStyles.ts': '/** @internal */\nexport const ROW_STYLES = {}\n',
    })
    expect(buildIndex(srcDir)).toContain(
      "export { Row, type RowProps } from '@universe/transactions-ui/src/common/Row/Row'",
    )
    expect(buildIndex(srcDir)).not.toContain('ROW_STYLES')
    expect(buildIndex(srcDir)).not.toContain('Default')
  })

  it('rejects a name exported from two modules', () => {
    const srcDir = fixture({
      'common/Rate/Rate.tsx': 'export const Rate = 1\n',
      'swap/Rate/Rate.tsx': 'export const Rate = 2\n',
    })
    expect(() => buildIndex(srcDir)).toThrow(/Duplicate export name Rate/)
  })

  it.each([
    "export { Row } from './Row'",
    "export type { RowProps } from './Row'",
    "export * from './Row'",
    "export type * from './Row'",
    'export default Row',
  ])('rejects `%s` instead of dropping it', (line) => {
    const srcDir = fixture({ 'common/Row/index.ts': `${line}\n` })
    expect(() => buildIndex(srcDir)).toThrow(/export at the declaration/)
  })
})
