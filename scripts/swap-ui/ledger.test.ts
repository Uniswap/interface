/**
 * Run with `bun test scripts/swap-ui/ledger.test.ts`
 *
 * Drift pins for the swap-ui movability ledger. Deliberately imports nothing
 * from node_modules (bun builtins only) so the CI job can run it without an
 * install, same constraint as tamagui-census.test.ts.
 */
import { afterAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  ADAPTER_SOURCE,
  analyzeFile,
  BLOCKER_CLASSES,
  BLOCKER_DEFS,
  buildBatches,
  classify,
  fileStatus,
  HEURISTIC_VERSION,
  isAdapter,
  parseImports,
  renderHtml,
  renderSummary,
  scan,
  SCHEMA_VERSION,
} from './ledger'

const REPO_ROOT = join(import.meta.dir, '../..')

function classOf(source: string, opts: { names?: string[]; typeOnly?: boolean } = {}): string | undefined {
  return classify({ source, names: opts.names ?? [], typeOnly: opts.typeOnly ?? false })?.cls
}

/** One fixture per file class the ledger reports, shaped like the real swap tree. */
const FIXTURES = {
  blockedView: `
import { Flex } from 'ui/src'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore'

export function BlockedView(): JSX.Element {
  const amount = useSwapFormStore((s) => s.exactAmountToken)
  return <Flex>{amount}</Flex>
}
`,
  cleanView: `
import { Flex } from '@universe/mycelium/flex'

export function CleanView({ label }: { label: string }): JSX.Element {
  return <Flex>{label}</Flex>
}
`,
  stub: `
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Stub = (): JSX.Element => {
  throw new PlatformSplitStubError('Stub')
}
`,
  // Mirrors components/SwapRateRatio.tsx: reads a store, derives values, renders the package view.
  adapter: `
import { type RateDisplay, RateRatio } from '@universe/swap-ui'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'

export function SwapRateRatio({ trade }: { trade: Trade }): JSX.Element {
  const formatter = useSwapFormStore((s) => s.formatter)
  const rate: RateDisplay = { rate: getRateToDisplay({ formatter, trade }) }
  return <RateRatio rate={rate} />
}
`,
}

describe('parseImports', () => {
  test('parses single-line, multi-line, and type-only imports', () => {
    const imports = parseImports(`
import { Flex } from 'ui/src'
import type {
  DerivedSwapInfo,
  Warning,
} from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore'
`)
    expect(imports).toHaveLength(3)
    expect(imports[0]).toMatchObject({ source: 'ui/src', typeOnly: false })
    expect(imports[1]?.typeOnly).toBe(true)
    expect(imports[1]?.names).toEqual(['DerivedSwapInfo', 'Warning'])
    expect(imports[2]?.names).toEqual(['useSwapFormStore'])
  })
})

describe('classify', () => {
  test('maps each blocker class', () => {
    expect(classOf('ui/src')).toBe('ui-src')
    expect(classOf('ui/src/components/layout')).toBe('ui-src')
    expect(classOf('@universe/gating')).toBe('flags')
    expect(classOf('@universe/compliance')).toBe('flags')
    expect(classOf('@tanstack/react-query')).toBe('query')
    expect(classOf('uniswap/src/features/telemetry/Trace')).toBe('telemetry')
    expect(classOf('utilities/src/telemetry/analytics/analytics')).toBe('telemetry')
    expect(classOf('uniswap/src/components/modals/Modal')).toBe('modal-shell')
    expect(classOf('uniswap/src/features/transactions/swap/stores/swapFormStore')).toBe('store-read')
    expect(classOf('uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore')).toBe('store-read')
    expect(classOf('uniswap/src/contexts/UniswapContext')).toBe('store-read')
    expect(classOf('react-redux')).toBe('store-read')
    expect(classOf('uniswap/src/features/transactions/swap/types/trade', { typeOnly: true })).toBe('types-pending')
    expect(classOf('uniswap/src/utils/currencyId')).toBe('uniswap-runtime')
  })

  test('store hook names blocker wins over type-only on uniswap sources', () => {
    expect(classOf('uniswap/src/features/transactions/hooks', { names: ['useSwapTxStore'] })).toBe('store-read')
  })

  test('presentational imports are not blockers', () => {
    expect(classOf('react')).toBeUndefined()
    expect(classOf('@universe/mycelium/flex')).toBeUndefined()
    expect(classOf('uniswap/i18n')).toBeUndefined()
    expect(classOf(ADAPTER_SOURCE)).toBeUndefined()
  })
})

describe('analyzeFile', () => {
  test('a view with blockers is neither movable nor an adapter', () => {
    const entry = analyzeFile('components/BlockedView.tsx', FIXTURES.blockedView)
    expect(entry).toMatchObject({ movable: false, stub: false, adapter: false })
    expect(Object.keys(entry.blockers)).toEqual(['ui-src', 'store-read'])
    expect(fileStatus(entry)).toBe('ui-src(1) store-read(1)')
  })

  test('a props-only view is movable', () => {
    const entry = analyzeFile('views/CleanView.tsx', FIXTURES.cleanView)
    expect(entry).toMatchObject({ movable: true, stub: false, adapter: false, blockers: {} })
    expect(fileStatus(entry)).toBe('MOVABLE')
  })

  test('a platform stub is clean but never movable', () => {
    const entry = analyzeFile('components/Stub.tsx', FIXTURES.stub)
    expect(entry).toMatchObject({ movable: false, stub: true, adapter: false, blockers: {} })
  })

  test('importing @universe/swap-ui makes the file an adapter with no blockers', () => {
    const entry = analyzeFile('components/SwapRateRatio.tsx', FIXTURES.adapter)
    expect(entry).toMatchObject({ movable: false, stub: false, adapter: true, blockers: {} })
    expect(fileStatus(entry)).toBe('ADAPTER')
  })

  test('isAdapter matches the package root and its subpaths only', () => {
    expect(isAdapter(parseImports(`import { RateRatio } from '@universe/swap-ui'`))).toBe(true)
    expect(isAdapter(parseImports(`import type { RateDisplay } from '@universe/swap-ui/types'`))).toBe(true)
    expect(isAdapter(parseImports(`import { x } from '@universe/swap-ui-tools'`))).toBe(false)
    expect(isAdapter(parseImports(`import { Flex } from '@universe/mycelium/flex'`))).toBe(false)
    expect(isAdapter([])).toBe(false)
  })
})

describe('scan (fixture tree)', () => {
  const root = mkdtempSync(join(tmpdir(), 'swap-ui-ledger-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  const tree: Record<string, string> = {
    'components/SwapRateRatio.tsx': FIXTURES.adapter,
    'components/BlockedView.tsx': FIXTURES.blockedView,
    'components/Stub.tsx': FIXTURES.stub,
    'review/ReviewRow.tsx': FIXTURES.blockedView,
    'views/CleanView.tsx': FIXTURES.cleanView,
    // Skipped by the walker, must not show up anywhere.
    'components/BlockedView.test.tsx': FIXTURES.blockedView,
  }
  for (const [rel, content] of Object.entries(tree)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), content)
  }
  const ledger = scan(root)

  test('adapters are listed but excluded from total, movable, stubs and byClass', () => {
    expect(ledger.files.map((f) => f.path)).toEqual([
      'components/BlockedView.tsx',
      'components/Stub.tsx',
      'components/SwapRateRatio.tsx',
      'review/ReviewRow.tsx',
      'views/CleanView.tsx',
    ])
    expect(ledger.adapters).toBe(1)
    expect(ledger.total).toBe(4)
    expect(ledger.total + ledger.adapters).toBe(ledger.files.length)
    expect(ledger.movable).toBe(1)
    expect(ledger.stubs).toBe(1)
    // The adapter's store read and runtime util are not counted against any class.
    expect(ledger.byClass['store-read']).toBe(2)
    expect(ledger.byClass['ui-src']).toBe(2)
    expect(ledger.byClass['uniswap-runtime']).toBe(0)
    expect(ledger.byClass['types-pending']).toBe(0)
  })

  test('batches skip adapters and movable files', () => {
    const batches = buildBatches(ledger)
    expect(batches.map((b) => b.dir)).toEqual(['review', 'components'])
    const batched = batches.flatMap((b) => b.files)
    expect(batched).toContain('components/BlockedView.tsx')
    expect(batched).toContain('review/ReviewRow.tsx')
    expect(batched).not.toContain('components/SwapRateRatio.tsx')
    expect(batched).not.toContain('views/CleanView.tsx')
  })

  test('summary and html report the adapter count and chip', () => {
    const summary = renderSummary(ledger)
    expect(summary).toContain('**1 adapters**')
    expect(summary).toContain('| components | 2 | 0 | 1 | 1 |')

    const html = renderHtml(ledger)
    expect(html).toContain('<b>1</b><span>adapters (already split)</span>')
    expect(html).toContain('data-f="adapter"')
    expect(html).toContain('adapter-chip">ADAPTER')
    expect(html).toContain('"p":"components/SwapRateRatio.tsx","b":[],"m":false,"s":false,"a":true')
  })
})

describe('scan (real swap tree)', () => {
  const ledger = scan()

  test('scans the real swap tree with a complete class breakdown', () => {
    expect(ledger.schemaVersion).toBe(SCHEMA_VERSION)
    expect(ledger.heuristicVersion).toBe(HEURISTIC_VERSION)
    expect(ledger.total).toBeGreaterThan(50)
    expect(ledger.movable).toBeLessThanOrEqual(ledger.total)
    expect(ledger.total + ledger.adapters).toBe(ledger.files.length)
    expect(Object.keys(ledger.byClass).sort()).toEqual([...BLOCKER_CLASSES].sort())
    expect(Object.keys(ledger.blockerClasses).sort()).toEqual([...BLOCKER_CLASSES].sort())
  })

  test('stubs are never counted movable and blocked files never are either', () => {
    for (const f of ledger.files) {
      if (f.movable) {
        expect(f.stub).toBe(false)
        expect(f.adapter).toBe(false)
        expect(Object.keys(f.blockers)).toHaveLength(0)
      }
    }
  })

  test('adapters carry no blockers and are never movable', () => {
    for (const f of ledger.files.filter((e) => e.adapter)) {
      expect(f.movable).toBe(false)
      expect(Object.keys(f.blockers)).toHaveLength(0)
    }
  })

  test('SwapRateRatio, the first tenant adapter, is reported as one', () => {
    const entry = ledger.files.find((f) => f.path === 'components/SwapRateRatio.tsx')
    expect(entry?.adapter).toBe(true)
    expect(ledger.adapters).toBeGreaterThanOrEqual(1)
    expect(buildBatches(ledger).flatMap((b) => b.files)).not.toContain('components/SwapRateRatio.tsx')
  })

  test('summary renders every class with its count', () => {
    const summary = renderSummary(ledger)
    for (const cls of BLOCKER_CLASSES) {
      expect(summary).toContain(`| \`${cls}\` | ${ledger.byClass[cls]} |`)
    }
    expect(summary).toContain(`**${ledger.adapters} adapters**`)
  })
})

describe('version pins', () => {
  // The JSON is a stable interface for the CI artifact and downstream tooling.
  // Bumping either number is a deliberate act: update the ledger.ts changelog with it.
  test('schema and heuristic versions', () => {
    expect(SCHEMA_VERSION).toBe(2)
    expect(HEURISTIC_VERSION).toBe(2)
  })
})

describe('fence <-> ledger drift pin', () => {
  // The swap-ui-views oxlint boundary must stay a subset of what the ledger
  // counts as a blocker: if the fence denies an import the ledger calls clean,
  // the two disagree about the definition of a view and one of them is wrong.
  test('every import the swap-ui-views boundary denies is a ledger blocker', () => {
    const { boundaries } = JSON.parse(
      readFileSync(join(REPO_ROOT, 'config/oxlint-plugins/import-boundaries.json'), 'utf8'),
    ) as { boundaries: { id: string; importPrefixes: string[]; bareModuleSources: string[] }[] }
    const fence = boundaries.find((b) => b.id === 'swap-ui-views')
    expect(fence).toBeDefined()
    for (const source of [...(fence?.importPrefixes ?? []), ...(fence?.bareModuleSources ?? [])]) {
      const cls = classOf(source)
      expect(`${source} -> ${cls}`).not.toEndWith('undefined')
      // The fence only names classes that policy bans outright; the
      // drain-by-refactor classes (ui-src, uniswap-runtime, types-pending)
      // are ledger-tracked, not fenced.
      expect(['store-read', 'flags', 'query', 'telemetry', 'modal-shell']).toContain(cls)
    }
  })

  test('every blocker class has a definition', () => {
    for (const cls of BLOCKER_CLASSES) {
      expect(BLOCKER_DEFS[cls].short.length).toBeGreaterThan(0)
      expect(BLOCKER_DEFS[cls].definition.length).toBeGreaterThan(0)
      expect(BLOCKER_DEFS[cls].drains.length).toBeGreaterThan(0)
    }
  })
})
