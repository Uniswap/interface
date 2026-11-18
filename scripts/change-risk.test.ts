/**
 * Run with `bun test ./scripts/change-risk.test.ts`.
 *
 * change-risk.ts reports; its failure mode is a report that reassures about
 * the wrong area or misses the manual cases a change needs. The cases below
 * pin the area mapping, the history scoring, the tier thresholds, the catalog
 * read and the shape of the report, with git stubbed. Code-path matching is the
 * Casebook engine's and is covered by its own tests.
 */
import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CHURN_AREAS,
  CaseRef,
  MAX_COMMENT_LENGTH,
  MIN_COMMITS,
  OUTSIDE_INLINE,
  areaOf,
  coverageOf,
  readCases,
  renderReport,
  riskOf,
  scoreHistory,
  tierOf,
  shouldPost,
} from './change-risk'

describe('areaOf', () => {
  test('reads the product-area level of app and package src trees', () => {
    expect(areaOf('apps/web/src/pages/Swap/Swap/SwapForm.tsx')).toBe('apps/web/src/pages/Swap')
    expect(areaOf('apps/mobile/src/components/earn/EarnCard.tsx')).toBe('apps/mobile/src/components/earn')
    expect(areaOf('apps/extension/src/app/features/dapp/Connect.tsx')).toBe('apps/extension/src/app/features/dapp')
    expect(areaOf('packages/uniswap/src/features/transactions/swap/hooks.ts')).toBe(
      'packages/uniswap/src/features/transactions',
    )
    expect(areaOf('packages/utilities/src/time/time.ts')).toBe('packages/utilities/src/time')
  })

  test('is null outside a src tree', () => {
    expect(areaOf('bun.lock')).toBeNull()
    expect(areaOf('.github/workflows/ci.yml')).toBeNull()
    expect(areaOf('packages/casebook/swap/scenarios/core.md')).toBeNull()
    expect(areaOf('apps/web/vite.config.ts')).toBeNull()
  })
})

describe('scoreHistory', () => {
  const log = [
    '\u0001aaa feat(web): add thing',
    'apps/web/src/pages/Swap/a.tsx',
    'apps/web/src/pages/Swap/b.tsx',
    '',
    '\u0001bbb fix(web): repair thing',
    'apps/web/src/pages/Swap/a.tsx',
    'apps/web/src/pages/Swap/b.tsx',
    'packages/uniswap/src/features/transactions/x.ts',
    '',
    '\u0001ccc Revert "feat(web): add thing"',
    'apps/web/src/pages/Swap/b.tsx',
    '',
    '\u0001ddd chore: bump',
    'bun.lock',
    '',
  ].join('\n')

  test('counts distinct commits per area (a wide fix counts once) and file touches for context', () => {
    const stats = scoreHistory(log)
    // The fix commit touches two Swap files: two touches, one commit.
    expect(stats.get('apps/web/src/pages/Swap')).toEqual({ commits: 3, fixCommits: 2, touches: 5, fixTouches: 3 })
    expect(stats.get('packages/uniswap/src/features/transactions')).toEqual({
      commits: 1,
      fixCommits: 1,
      touches: 1,
      fixTouches: 1,
    })
    expect(stats.has('bun.lock')).toBe(false)
  })
})

/** Commits and fix commits; touches follow at 5× so the context columns are populated. */
const stat = (commits: number, fixCommits: number) => ({
  commits,
  fixCommits,
  touches: commits * 5,
  fixTouches: fixCommits * 5,
})

describe('tierOf', () => {
  test('needs enough history to say anything', () => {
    expect(tierOf('apps/web/src/pages/Swap', undefined)).toBe('unscored')
    expect(tierOf('apps/web/src/pages/Swap', stat(MIN_COMMITS - 1, MIN_COMMITS - 1))).toBe('unscored')
  })

  test('tiers by fix share of commits only; volume never promotes a large area', () => {
    expect(tierOf('a', stat(100, 10))).toBe('low')
    expect(tierOf('a', stat(100, 20))).toBe('medium')
    expect(tierOf('a', stat(100, 30))).toBe('high')
    // 10% share with 300 fix commits is still low: size is not risk.
    expect(tierOf('a', stat(3000, 300))).toBe('low')
  })

  test('migration churn is reported, never tiered', () => {
    expect(tierOf(CHURN_AREAS[0] ?? '', stat(1000, 900))).toBe('churn')
    expect(tierOf('packages/mycelium/src/components', stat(1000, 900))).toBe('high')
  })
})

describe('riskOf', () => {
  test('groups changed files by area and orders worst first', () => {
    const history = new Map([
      ['apps/web/src/pages/Swap', stat(1000, 50)],
      ['apps/web/src/features/Liquidity', stat(1000, 300)],
    ])
    const risk = riskOf(
      [
        'apps/web/src/pages/Swap/a.tsx',
        'apps/web/src/features/Liquidity/b.tsx',
        'apps/web/src/features/Liquidity/c.tsx',
        'apps/web/src/pages/Fresh/d.tsx',
        'bun.lock',
      ],
      history,
    )
    expect(risk.map((area) => [area.area, area.tier, area.changedFiles.length])).toEqual([
      ['apps/web/src/features/Liquidity', 'high', 2],
      ['apps/web/src/pages/Swap', 'low', 1],
      ['apps/web/src/pages/Fresh', 'unscored', 1],
    ])
  })
})

describe('catalog', () => {
  const scenario = ({ id, title, refs }: { id: string; title: string; refs: string }): string => `---
id: ${id}
title: ${title}
priority: high
severity: high
source: uniswap
platforms:
  - web
labels:
  - regression
automatable: true
testLevel: e2e
runFrequency: scheduled
code_paths:
  - apps/web/src/pages/Swap/
${refs}
---
`
  const markdown = `# Swap scenarios

Prose before the cases. A \`---\` inside a code fence is not a case:

\`\`\`yaml
---
id: not-a-case
---
\`\`\`

${scenario({
  id: 'swap-basic',
  title: 'Swap ETH for USDC',
  refs: 'automationRefs:\n  - path: apps/web/src/pages/Swap/Swap.e2e.test.ts',
})}
${scenario({ id: 'swap-manual', title: 'Swap with a hardware wallet', refs: 'automationRefs: []' })}`

  test('readCases reads every valid case through the Casebook engine, named by its catalog directory', async () => {
    const root = mkdtempSync(join(tmpdir(), 'change-risk-'))
    const area = join(root, 'packages/casebook/swap-core')
    mkdirSync(join(area, 'scenarios'), { recursive: true })
    writeFileSync(
      join(area, '_defaults.yaml'),
      'product_area: swap.core\nplatforms: [web]\nnxProjects: ["@universe/web"]\nlabel: Swap\nsuiteNamePrefix: Swap\n',
    )
    writeFileSync(join(area, 'scenarios/core.md'), markdown)

    const cases = await readCases(root)
    expect(cases.map((item) => [item.id, item.area, item.automated])).toEqual([
      ['swap-basic', 'swap-core', true],
      ['swap-manual', 'swap-core', false],
    ])
    const coverage = coverageOf(['apps/web/src/pages/Swap/Swap/SwapForm.tsx'], cases)
    expect(coverage.automated.map((item) => item.id)).toEqual(['swap-basic'])
    expect(coverage.manual.map((item) => item.id)).toEqual(['swap-manual'])
    expect(coverageOf(['packages/ui/src/theme.ts'], cases)).toEqual({ automated: [], manual: [] })
  })
})

describe('renderReport', () => {
  const lp1: CaseRef = {
    id: 'lp-1',
    title: 'Add liquidity',
    area: 'lp',
    priority: 'high',
    automatable: true,
    automated: false,
  }

  test('leads with the worst tier, lists manual cases, and carries the sticky-comment marker', () => {
    const report = renderReport({
      changedFiles: ['apps/web/src/features/Liquidity/b.tsx', 'bun.lock'],
      risk: [
        {
          area: 'apps/web/src/features/Liquidity',
          commits: 200,
          fixCommits: 60,
          touches: 1000,
          fixTouches: 300,
          tier: 'high',
          changedFiles: ['apps/web/src/features/Liquidity/b.tsx'],
        },
      ],
      coverage: { automated: [], manual: [lp1] },
      since: '180 days ago',
      base: 'main',
    })
    expect(report.startsWith('<!-- change-risk-report -->')).toBe(true)
    expect(report).toContain('highest risk tier: **🔴 high**')
    expect(report).toContain('Share of commits on `main` over the last 180 days')
    expect(report).toContain('| `apps/web/src/features/Liquidity` | 1 | 200 | 60 | 30% | 1000 | 🔴 high |')
    expect(report).toContain('1 file(s) outside any area')
    expect(report).toContain('- `lp-1` Add liquidity — lp, high _(automatable, not automated)_')
    expect(report).toContain('**0 automated**, **1 manual**, of which **1** are marked automatable')
  })

  test('lists what each PR tier runs when the selections are given', () => {
    const report = renderReport({
      changedFiles: ['apps/web/src/pages/Swap/Swap/SwapForm.tsx'],
      risk: [],
      coverage: { automated: [], manual: [] },
      since: '180 days ago',
      base: 'main',
      selections: [
        {
          target: 'web',
          mode: 'targeted',
          specCount: 2,
          files: 'src/pages/Swap/Swap/Swap.e2e.test.ts src/pages/Swap/Swap/Swap.anvil.e2e.test.ts',
          reason:
            'apps/web/src/pages/Swap/Swap/SwapForm.tsx: 2 spec(s) under apps/web/src/pages/Swap/; 14 unstable spec(s) withheld from this tier; the scheduled suites cover them',
        },
        { target: 'extension', mode: 'none', specCount: 0, files: '', reason: 'no changed file reaches extension' },
        { target: 'mobile', mode: 'error', specCount: 0, files: '', reason: 'error: rules entry matches no spec' },
      ],
    })
    expect(report).toContain('### What CI runs')
    expect(report).toContain(
      '- **mobile**: selector failed, see the Change report job log: error: rules entry matches no spec',
    )
    expect(report).toContain('- **web**: targeted, 2 tests: `Swap.e2e.test.ts`, `Swap.anvil.e2e.test.ts`')
    expect(report).toContain('- **extension**: nothing')
    expect(report).toContain('  - 14 unstable spec(s) withheld from this tier')
    expect(report.indexOf('### What CI runs')).toBeLessThan(report.indexOf('### What covers it'))
  })

  test('says so when nothing is scored or covered', () => {
    const report = renderReport({
      changedFiles: ['bun.lock'],
      risk: [],
      coverage: { automated: [], manual: [] },
      since: '180 days ago',
      base: 'main',
    })
    expect(report).toContain('highest risk tier: **none scored**')
    expect(report).toContain('No changed file is under a scored area.')
    expect(report).toContain('No Casebook case lists a changed path')
  })

  test('folds a long outside-area list and stays under the GitHub comment limit', () => {
    const changedFiles = Array.from({ length: 5000 }, (_, i) => `docs/${'x'.repeat(40)}-${i}.md`)
    const report = renderReport({
      changedFiles,
      risk: [],
      coverage: { automated: [], manual: [] },
      since: '180 days ago',
      base: 'main',
    })
    expect(report).toContain(`- \`${changedFiles[OUTSIDE_INLINE - 1]}\``)
    expect(report).not.toContain(`- \`${changedFiles[OUTSIDE_INLINE]}\``)
    expect(report).toContain(`- … and ${5000 - OUTSIDE_INLINE} more`)
    expect(report.length).toBeLessThanOrEqual(MAX_COMMENT_LENGTH)

    const manual = Array.from({ length: 3000 }, (_, i) => ({ ...lp1, id: `lp-${i}`, title: 'y'.repeat(60) }))
    const long = renderReport({
      changedFiles: ['bun.lock'],
      risk: [],
      coverage: { automated: [], manual },
      since: '180 days ago',
      base: 'main',
    })
    expect(long.length).toBeLessThanOrEqual(MAX_COMMENT_LENGTH)
    expect(long.endsWith('truncated to fit a GitHub comment._')).toBe(true)
  })
})

describe('shouldPost', () => {
  const empty = { risk: [], coverage: { automated: [], manual: [] } }
  const area = (tier: 'high' | 'unscored' | 'churn') => ({
    area: 'apps/web/src/features/X',
    commits: 0,
    fixCommits: 0,
    touches: 0,
    fixTouches: 0,
    tier,
    changedFiles: ['apps/web/src/features/X/a.tsx'],
  })
  const sel = (mode: 'none' | 'targeted') => ({ target: 'web', mode, specCount: 0, files: '', reason: '' })

  test('nothing named, nothing covered, nothing selected: no first comment', () => {
    expect(shouldPost(empty)).toBe(false)
    expect(shouldPost({ ...empty, selections: [sel('none')] })).toBe(false)
  })

  test('any named area posts, scored or not', () => {
    expect(shouldPost({ ...empty, risk: [area('high')] })).toBe(true)
    expect(shouldPost({ ...empty, risk: [area('unscored')] })).toBe(true)
    expect(shouldPost({ ...empty, risk: [area('churn')] })).toBe(true)
  })

  test('a covering case or a selected e2e test posts on its own', () => {
    const lp: CaseRef = { id: 'lp-1', title: 't', area: 'lp', priority: 'high', automatable: true, automated: true }
    expect(shouldPost({ ...empty, coverage: { automated: [lp], manual: [] } })).toBe(true)
    expect(shouldPost({ ...empty, selections: [sel('targeted')] })).toBe(true)
  })
})

describe('renderReport selections', () => {
  test('names up to eight selected files and only counts past that', () => {
    const files = (n: number) => Array.from({ length: n }, (_, i) => `src/pages/A/Spec${i}.e2e.test.ts`).join(' ')
    const render = (n: number) =>
      renderReport({
        changedFiles: [],
        risk: [],
        coverage: { automated: [], manual: [] },
        since: '180 days ago',
        base: 'main',
        selections: [{ target: 'web', mode: 'targeted', specCount: n, files: files(n), reason: '' }],
      })
    expect(render(8)).toContain('- **web**: targeted, 8 tests: `Spec0.e2e.test.ts`')
    expect(render(9)).toContain('- **web**: targeted, 9 tests\n')
    expect(render(9)).not.toContain('Spec0.e2e.test.ts')
  })
})
