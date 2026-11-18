import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  buildCatalog,
  firstSentence,
  isCatalogCurrent,
  renderCatalog,
} from '@universe/transactions-ui/src/scripts/generateCatalog'
import { afterEach, describe, expect, it } from 'vitest'

const SRC_DIR = join(__dirname, '..')

describe('catalog.json', () => {
  it('matches the generator output (run `bun transactions-ui generate:catalog` after adding or changing a view)', () => {
    const onDisk = readFileSync(join(SRC_DIR, '..', 'catalog.json'), 'utf8')
    expect(isCatalogCurrent(onDisk, buildCatalog(SRC_DIR))).toBe(true)
  })
})

describe('generateCatalog', () => {
  let root: string | undefined

  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true })
    }
    root = undefined
  })

  function fixture(files: Record<string, string>): string {
    root = mkdtempSync(join(tmpdir(), 'transactions-ui-catalog-'))
    for (const [path, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), source)
    }
    return root
  }

  const ROW = `import type { ReactNode } from 'react'

export interface RowProps {
  /** Product copy. Pass a node to wrap it. */
  label: ReactNode
  /**
   * Shown in the standard style, e.g. \`1.5%\`. Second sentence.
   */
  value?: string
  onPress: () => void
}

/**
 * One label/value line, e.g. \`Fee 0.25%\`. Everything else is detail.
 *
 * @alias InfoRow, KeyValueRow
 */
export function Row({ label, value, onPress }: RowProps): JSX.Element {
  return null as unknown as JSX.Element
}

/** @internal */
export function RowFrame(): null {
  return null
}

export function Shimmer({ loading }: PropsWithChildren<{ loading?: boolean }>): null {
  return null
}
`

  it('reads role, aliases, props, area and story, and skips legs, stories, tests and @internal', () => {
    const srcDir = fixture({
      'common/Row/Row.tsx': ROW,
      'common/Row/Row.native.tsx': 'export function Row(): null {\n  return null\n}\n',
      'common/Row/Row.test.tsx': 'export function RowTest(): null {\n  return null\n}\n',
      'common/Row/Row.stories.tsx': "const meta = {\n  title: 'transactions-ui/common/Row',\n  component: Row,\n}\n",
      'swap/Fee/FeeValue.tsx': 'export function FeeValue(): null {\n  return null\n}\n',
    })
    const { components } = buildCatalog(srcDir)

    expect(components.map((c) => c.name)).toEqual(['Row', 'Shimmer', 'FeeValue'])
    expect(components[0]).toEqual({
      name: 'Row',
      aliases: ['InfoRow', 'KeyValueRow'],
      area: 'common',
      role: 'One label/value line, e.g. `Fee 0.25%`.',
      module: 'packages/transactions-ui/src/common/Row/Row.tsx',
      story: 'transactions-ui/common/Row',
      propsType: 'RowProps',
      props: [
        { name: 'label', optional: false, doc: 'Product copy.' },
        { name: 'value', optional: true, doc: 'Shown in the standard style, e.g. `1.5%`.' },
        { name: 'onPress', optional: false, doc: null },
      ],
    })
    expect(components[1]?.props).toEqual([
      { name: 'loading', optional: true, doc: null },
      { name: 'children', optional: true, doc: null },
    ])
    expect(components[2]).toMatchObject({ area: 'swap', role: null, story: null, propsType: null, props: [] })
  })

  it('rejects an alias used twice or one that names a component', () => {
    const twice = fixture({
      'common/Alpha/Alpha.tsx': '/** @alias InfoRow */\nexport function Alpha(): null {\n  return null\n}\n',
      'common/Beta/Beta.tsx': '/** @alias InfoRow */\nexport function Beta(): null {\n  return null\n}\n',
    })
    expect(() => buildCatalog(twice)).toThrow(/Duplicate alias InfoRow/)
    rmSync(twice, { recursive: true, force: true })

    const shadow = fixture({
      'common/Alpha/Alpha.tsx': '/** @alias Beta */\nexport function Alpha(): null {\n  return null\n}\n',
      'common/Beta/Beta.tsx': 'export function Beta(): null {\n  return null\n}\n',
    })
    expect(() => buildCatalog(shadow)).toThrow(/already a component name/)
  })

  it('renders JSON that reads back as the same catalog', () => {
    const catalog = buildCatalog(fixture({ 'common/Row/Row.tsx': ROW }))
    expect(isCatalogCurrent(renderCatalog(catalog), catalog)).toBe(true)
    expect(isCatalogCurrent('{}', catalog)).toBe(false)
    expect(isCatalogCurrent('not json', catalog)).toBe(false)
  })
})

describe('firstSentence', () => {
  it('stops at the first sentence end outside code spans and abbreviations', () => {
    expect(firstSentence('The rate, e.g. `1 ETH = 3,241.20 USDC`. More.')).toBe(
      'The rate, e.g. `1 ETH = 3,241.20 USDC`.',
    )
    expect(firstSentence('No period at all')).toBe('No period at all')
    expect(firstSentence('  ')).toBeNull()
  })
})
