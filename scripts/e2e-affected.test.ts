/**
 * Run with `bun test ./scripts/e2e-affected.test.ts`.
 *
 * e2e-affected.ts decides which specs a PR runs; its failure mode is a green
 * PR that ran the wrong specs. The cases below pin the selection rules, the
 * fail-open paths and the leg packing, with the Nx graph and the rules file
 * stubbed so a case is just "this diff selects these specs". The web target
 * carries the selection cases; the single-type target cases cover what
 * differs for apps whose tests live apart from their code.
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import {
  type AffectedMap,
  type AffectedTarget,
  type NxGraphFile,
  TARGETS,
  dependencyRoots,
  listSpecs,
  packLegs,
  positiveIntFromEnv,
  resolveTarget,
  selectSpecs,
  selectorPaths,
  specWeights,
  validateRuleSpecs,
  withhold,
  withholdUnstable,
} from './e2e-affected'

const WEB = TARGETS['web'] as AffectedTarget
const SPECS = [
  'apps/web/src/app/WalletConnection.e2e.test.ts',
  'apps/web/src/components/AccountDrawer/AccountDrawer.e2e.test.ts',
  'apps/web/src/components/NavBar/SearchBar/SearchBar.e2e.test.ts',
  'apps/web/src/pages/Errors.e2e.test.ts',
  'apps/web/src/pages/NavBar.e2e.test.ts',
  'apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts',
  'apps/web/src/pages/Swap/Limit/LimitWrap.anvil.e2e.test.ts',
  'apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts',
  'apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts',
  'apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts',
  'apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts',
]
const MAP: AffectedMap = {
  exclude: ['pages/App.smoketest.e2e.test.ts'],
  ignore: ['packages/casebook/', '.github/', '**/CLAUDE.md'],
  rules: [
    {
      paths: ['packages/uniswap/src/features/transactions/swap/'],
      specs: ['pages/Swap/Swap/'],
    },
    {
      paths: ['apps/web/src/components/NavBar/'],
      specs: ['pages/NavBar.e2e.test.ts', 'components/NavBar/'],
    },
  ],
}
const WEB_DEPS = ['packages/ui', 'packages/uniswap', 'packages/utilities']
const ROOTS = ['apps/extension', 'apps/mobile', 'apps/web', 'apps/web-landing', ...WEB_DEPS]

function select(changedFiles: string[] | null, overrides: { runAll?: boolean } = {}) {
  return selectSpecs({
    target: WEB,
    runAll: overrides.runAll ?? false,
    changedFiles,
    specs: SPECS,
    dependencyRoots: WEB_DEPS,
    projectRoots: ROOTS,
    map: MAP,
  })
}

describe('selectSpecs', () => {
  test('a changed spec selects itself and nothing else', () => {
    const result = select(['apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts'])
    expect(result.mode).toBe('targeted')
    expect(result.specs).toEqual(['apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts'])
  })

  test('a change inside an area selects every spec under that area, anvil included', () => {
    const result = select(['apps/web/src/pages/Swap/Limit/LimitForm.tsx'])
    expect(result.mode).toBe('targeted')
    expect(result.specs).toEqual([
      'apps/web/src/pages/Swap/Limit/LimitWrap.anvil.e2e.test.ts',
      'apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts',
      'apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts',
      'apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts',
      'apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts',
    ])
  })

  test('a directory with no spec is not an area: it is web code nothing narrows, so the full suite runs', () => {
    for (const file of [
      'apps/web/src/pages/Beta/BetaPasscodePage.tsx',
      'apps/web/src/components/Popups/PopupItem.tsx',
    ]) {
      const result = select([file])
      expect(result.mode).toBe('full')
      expect(result.deferrable).toBe(true)
      expect(result.reasons.at(-1)).toContain('outside an area')
    }
  })

  test('a rule narrows a shared-package change to the specs it names', () => {
    const result = select(['packages/uniswap/src/features/transactions/swap/hooks/useSwap.ts'])
    expect(result.mode).toBe('targeted')
    expect(result.specs).toEqual([
      'apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts',
      'apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts',
      'apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts',
    ])
    expect(result.reasons[0]).toContain('via e2e-affected.json')
  })

  test('a rule beats co-location for web code it names', () => {
    // components/NavBar is an area, but the rule also pulls in pages/NavBar.
    const result = select(['apps/web/src/components/NavBar/NavBar.tsx'])
    expect(result.specs).toEqual([
      'apps/web/src/components/NavBar/SearchBar/SearchBar.e2e.test.ts',
      'apps/web/src/pages/NavBar.e2e.test.ts',
    ])
  })

  test('web code outside an area runs the full suite', () => {
    for (const file of [
      'apps/web/src/state/store.ts',
      'apps/web/src/playwright/fixtures/anvil.ts',
      'apps/web/vite.config.ts',
    ]) {
      const result = select([file])
      expect(result.mode).toBe('full')
      expect(result.specs).toEqual(SPECS)
      expect(result.reasons[0]).toContain(file)
      expect(result.reasons[0]).toContain('web code outside an area')
    }
  })

  test('a package web depends on, with no rule, runs the full suite', () => {
    const result = select(['packages/ui/src/components/Button.tsx'])
    expect(result.mode).toBe('full')
    expect(result.reasons[0]).toContain('@universe/web depends on')
  })

  test('an ignored path selects nothing even though no project owns it', () => {
    const result = select(['packages/casebook/lp/scenarios/create.md', '.github/workflows/web_staging_deploy.yml'])
    expect(result.mode).toBe('none')
  })

  test('a path no project owns runs the full suite', () => {
    const result = select(['bun.lock'])
    expect(result.mode).toBe('full')
    expect(result.reasons[0]).toContain('no Nx project')
  })

  test('a `**/` ignore entry matches that basename at any depth, and only that basename', () => {
    expect(select(['CLAUDE.md', 'packages/uniswap/CLAUDE.md']).mode).toBe('none')
    // Same prefix, different file: still unowned, still full.
    expect(select(['packages/uniswap/CLAUDE.md.bak']).mode).toBe('full')
  })

  test('a change to the selector or its rules runs the full suite, ignore list or not', () => {
    expect(selectorPaths(WEB)).toEqual([
      'scripts/e2e-affected.ts',
      'scripts/e2e-affected.test.ts',
      'apps/web/src/playwright/e2e-affected.json',
      '.github/workflows/web_e2e_tests_playwright_affected.yml',
      '.github/actions/playwright_matrix_test/',
    ])
    for (const file of selectorPaths(WEB)) {
      const result = select([file, 'packages/casebook/lp/scenarios/create.md'])
      expect(result.mode).toBe('full')
      expect(result.reasons[0]).toContain('selector itself changed')
    }
    // A ciPaths entry can be a directory; what changes is a file under it, which .github/ would otherwise ignore.
    const action = select(['.github/actions/playwright_matrix_test/action.yml'])
    expect(action.mode).toBe('full')
    expect(action.reasons[0]).toContain('selector itself changed')
    expect(select(['.github/actions/other_action/action.yml']).mode).toBe('none')
  })

  test('a project web does not depend on selects nothing', () => {
    const result = select(['apps/mobile/src/app/App.tsx', 'apps/extension/src/popup.tsx'])
    expect(result.mode).toBe('none')
    expect(result.reasons[0]).toBe('no changed file reaches web')
  })

  test('apps/web-landing is not apps/web', () => {
    const result = select(['apps/web-landing/src/index.tsx'])
    expect(result.mode).toBe('none')
  })

  test('full wins over targeted within one diff, but keeps what the other files reached for FALLBACK=skip', () => {
    const result = select(['apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts', 'packages/utilities/src/format.ts'])
    expect(result.mode).toBe('full')
    expect(result.deferrable).toBe(true)
    expect(result.targeted).toEqual(['apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts'])
    expect(result.reasons).toHaveLength(2)
  })

  test('run-all, an unreadable diff and a selector change are never deferred', () => {
    expect(select([], { runAll: true }).deferrable).toBeUndefined()
    expect(select(null).deferrable).toBeUndefined()
    expect(select(['scripts/e2e-affected.ts']).deferrable).toBeUndefined()
  })

  test('run-all and an unreadable diff fail open into the full suite', () => {
    expect(select([], { runAll: true }).mode).toBe('full')
    expect(select(null).mode).toBe('full')
    expect(select(null).reasons[0]).toContain('failing open')
  })

  test('an empty diff selects nothing', () => {
    expect(select([]).mode).toBe('none')
  })
})

describe('dependencyRoots', () => {
  const graph: NxGraphFile = {
    graph: {
      nodes: {
        '@universe/web': { data: { root: 'apps/web' } },
        '@universe/ui': { data: { root: 'packages/ui' } },
        utilities: { data: { root: 'packages/utilities' } },
        '@uniswap/mobile': { data: { root: 'apps/mobile' } },
        '@universe/cli': { data: { root: 'apps/cli' } },
      },
      dependencies: {
        '@universe/web': [
          { source: '@universe/web', target: '@universe/ui', type: 'static' },
          { source: '@universe/web', target: 'npm:react', type: 'static' },
        ],
        '@universe/ui': [{ source: '@universe/ui', target: 'utilities', type: 'static' }],
        utilities: [{ source: 'utilities', target: '@universe/web', type: 'static' }],
        '@uniswap/mobile': [{ source: '@uniswap/mobile', target: '@universe/ui', type: 'static' }],
      },
    },
  }

  test('follows project edges transitively, skips npm packages and cycles back to the project', () => {
    const { dependencyRoots: deps, projectRoots } = dependencyRoots(graph, '@universe/web')
    expect(deps).toEqual(['packages/ui', 'packages/utilities'])
    expect(projectRoots).toEqual(['apps/cli', 'apps/mobile', 'apps/web', 'packages/ui', 'packages/utilities'])
  })

  test('is per project: another app sees its own closure', () => {
    const { dependencyRoots: deps } = dependencyRoots(graph, '@uniswap/mobile')
    // mobile → ui → utilities → web: web is in mobile's closure in this stub graph, as the edge says.
    expect(deps).toEqual(['apps/web', 'packages/ui', 'packages/utilities'])
  })
})

describe('packLegs', () => {
  const swap = 'apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts'
  const sel = 'apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts'
  const tokens = 'apps/web/src/pages/Portfolio/Tokens/Tokens.e2e.test.ts'
  const anvil = 'apps/web/src/pages/Swap/Swap/Swap.anvil.e2e.test.ts'

  test('splits by test type and names legs the way the job matrix needs', () => {
    const legs = packLegs([swap, anvil], { target: WEB, maxShards: 8, specsPerShard: 8, includeAnvil: true })
    expect(legs).toEqual([
      {
        name: 'non-anvil 1/1',
        'test-type': 'non-anvil',
        files: 'src/pages/Swap/Swap/Swap.e2e.test.ts',
        'shard-index': 1,
        'shard-total': 1,
        specs: 1,
      },
      {
        name: 'anvil 1/1',
        'test-type': 'anvil',
        files: 'src/pages/Swap/Swap/Swap.anvil.e2e.test.ts',
        'shard-index': 1,
        'shard-total': 1,
        specs: 1,
      },
    ])
  })

  test('drops anvil legs when asked', () => {
    const legs = packLegs([swap, anvil], { target: WEB, maxShards: 8, specsPerShard: 8, includeAnvil: false })
    expect(legs.map((leg) => leg['test-type'])).toEqual(['non-anvil'])
  })

  test('opens a leg per specsPerShard files, capped at maxShards, and balances by weight', () => {
    const legs = packLegs([swap, sel, tokens], {
      target: WEB,
      maxShards: 2,
      specsPerShard: 1,
      includeAnvil: true,
      weights: { [swap]: 10, [sel]: 1, [tokens]: 1 },
    })
    expect(legs.map((leg) => leg['shard-total'])).toEqual([2, 2])
    expect(legs[0]?.files).toBe('src/pages/Swap/Swap/Swap.e2e.test.ts')
    expect(legs[1]?.files).toBe(
      'src/pages/Portfolio/Tokens/Tokens.e2e.test.ts src/pages/Swap/Swap/TokenSelector.e2e.test.ts',
    )
  })

  test('never emits an empty leg', () => {
    const legs = packLegs([swap], { target: WEB, maxShards: 8, specsPerShard: 1, includeAnvil: true })
    expect(legs).toHaveLength(1)
  })
})

describe('a target whose tests live apart from its code', () => {
  const APART: AffectedTarget = {
    name: 'apart',
    project: '@universe/apart',
    appRoot: 'apps/apart',
    specRoot: 'apps/apart/e2e/tests',
    mapPath: 'apps/apart/e2e/e2e-affected.json',
    filesRelativeTo: 'apps/apart',
    testTypes: ['default'],
    isSpec: (path) => path.endsWith('.test.ts'),
    testTypeOf: () => 'default',
    areaOf: () => null,
  }
  const APART_SMOKE = 'apps/apart/e2e/tests/smoke/setup.test.ts'
  const APART_SWAP = 'apps/apart/e2e/tests/swap/swap.test.ts'
  const APART_SPECS = [APART_SMOKE, APART_SWAP]
  const apart = (changedFiles: string[]) =>
    selectSpecs({
      target: APART,
      runAll: false,
      changedFiles,
      specs: APART_SPECS,
      dependencyRoots: ['packages/uniswap'],
      projectRoots: ['apps/apart', 'apps/web', 'packages/uniswap'],
      map: { rules: [{ paths: ['apps/apart/src/features/swap/'], specs: ['swap/'] }] },
    })

  test('selects by rule, and app code no rule names runs the full suite', () => {
    expect(apart(['apps/apart/src/features/swap/SwapForm.tsx']).specs).toEqual([APART_SWAP])
    const unruled = apart(['apps/apart/src/features/onboarding/Flow.tsx'])
    expect(unruled.mode).toBe('full')
    expect(unruled.reasons[0]).toContain('apart code outside an area')
    expect(apart(['apps/web/src/pages/Swap/Swap.tsx']).mode).toBe('none')
  })

  test('the full-suite guard names the target rules file', () => {
    expect(selectorPaths(APART)).toContain('apps/apart/e2e/e2e-affected.json')
    expect(apart(['apps/apart/e2e/e2e-affected.json']).mode).toBe('full')
  })

  test('legs are one type, named by shard only, with files relative to the app', () => {
    const legs = packLegs(APART_SPECS, { target: APART, maxShards: 1, specsPerShard: 8, includeAnvil: true })
    expect(legs).toEqual([
      {
        name: '1/1',
        'test-type': 'default',
        files: 'e2e/tests/smoke/setup.test.ts e2e/tests/swap/swap.test.ts',
        'shard-index': 1,
        'shard-total': 1,
        specs: 2,
      },
    ])
  })
})

describe('the registered targets against the real tree', () => {
  const repoRoot = join(import.meta.dir, '..')
  const real = (path: string) => join(repoRoot, path)

  test('extension: specs apart from the code, one test type, files relative to the app', () => {
    const extension = resolveTarget('extension')
    expect(extension.project).toBe('@uniswap/extension')
    expect(extension.areaOf('apps/extension/src/app/features/swap/SwapScreen.tsx')).toBeNull()
    expect(extension.isSpec('apps/extension/e2e/tests/swap/sidepanel-swap.test.ts')).toBe(true)
    expect(listSpecs(real(extension.specRoot), [], extension.isSpec).length).toBeGreaterThan(0)
  })

  test('mobile: Maestro flows selected by a per-flow tag that every flow declares', () => {
    const mobile = resolveTarget('mobile')
    expect(mobile.project).toBe('@uniswap/mobile')
    expect(mobile.tagOf?.('apps/mobile/.maestro/flows/explore/search.yaml')).toBe('flow-search')
    const flows = listSpecs(real(mobile.specRoot), [], mobile.isSpec)
    expect(flows.length).toBeGreaterThan(0)
    const names = flows.map((flow) => mobile.tagOf?.(flow))
    expect(new Set(names).size, 'flow basenames must be unique: the tag is the basename').toBe(flows.length)
    for (const flow of flows) {
      const header = readFileSync(flow, 'utf8').split('\n---\n')[0] ?? ''
      expect(header, `${relative(repoRoot, flow)} must declare tags: - ${mobile.tagOf?.(flow)}`).toContain(
        `\n  - ${mobile.tagOf?.(flow)}\n`,
      )
    }
  })

  test('every rules file names only paths that exist, so a rename cannot leave a rule or ignore entry dead', () => {
    for (const target of Object.values(TARGETS)) {
      const map = JSON.parse(readFileSync(real(target.mapPath), 'utf8')) as AffectedMap
      const entries = [
        ...map.rules.flatMap((rule) => rule.paths),
        ...(map.ignore ?? []).filter((e) => !e.startsWith('**/')),
        ...(target.ciPaths ?? []),
      ]
      for (const entry of entries) {
        expect(existsSync(real(entry)), `${target.name}: ${entry}`).toBe(true)
      }
    }
  })

  test('every rules file names only spec prefixes that match a real spec', () => {
    for (const target of Object.values(TARGETS)) {
      const map = JSON.parse(readFileSync(real(target.mapPath), 'utf8')) as AffectedMap
      const specs = listSpecs(real(target.specRoot), [], target.isSpec).map((spec) => relative(repoRoot, spec))
      const matches = (entry: string) => specs.some((spec) => spec.startsWith(join(target.specRoot, entry)))
      for (const entry of [
        ...(map.exclude ?? []),
        ...(map.unstable ?? []),
        ...(map.broken ?? []),
        ...(map.pinned ?? []),
      ]) {
        expect(matches(entry), `${target.name}: ${entry}`).toBe(true)
      }
      for (const rule of map.rules) {
        for (const entry of rule.specs) {
          expect(matches(entry), `${target.name}: ${rule.paths[0]} → ${entry}`).toBe(true)
        }
      }
    }
  })

  test('the English source strings select nothing on any target: a changed string is a test to update, not a regression', () => {
    for (const target of Object.values(TARGETS)) {
      const map = JSON.parse(readFileSync(real(target.mapPath), 'utf8')) as AffectedMap
      const result = selectSpecs({
        target,
        runAll: false,
        changedFiles: ['packages/uniswap/src/i18n/locales/source/en-US.json'],
        specs: listSpecs(real(target.specRoot), [], target.isSpec).map((spec) => relative(repoRoot, spec)),
        dependencyRoots: ['packages/uniswap'],
        projectRoots: ['packages/uniswap', target.appRoot],
        map,
      })
      expect(result.mode, target.name).toBe('none')
    }
  })
})

describe('helpers', () => {
  test('positiveIntFromEnv falls back on blank, zero, negative and non-integer input', () => {
    expect(positiveIntFromEnv('3', 8)).toBe(3)
    for (const value of [undefined, '', '0', '-1', '2.5', 'x']) {
      expect(positiveIntFromEnv(value, 8)).toBe(8)
    }
  })

  test('validateRuleSpecs rejects a rule spec prefix that matches nothing', () => {
    expect(() => validateRuleSpecs(MAP, SPECS, WEB.specRoot)).not.toThrow()
    expect(() =>
      validateRuleSpecs({ rules: [{ paths: ['packages/x/'], specs: ['pages/Renamed/'] }] }, SPECS, WEB.specRoot),
    ).toThrow('matches no spec')
  })

  test('validateRuleSpecs accepts a rule that names an excluded spec: the selector checks the tree before exclusion', () => {
    // Mobile's send/ is both excluded (outside the Maestro Cloud config) and named by a rule.
    const smoke = 'apps/web/src/pages/App.smoketest.e2e.test.ts'
    const rule = { rules: [{ paths: ['packages/x/'], specs: ['pages/App.smoketest.e2e.test.ts'] }] }
    expect(() => validateRuleSpecs(rule, [...SPECS, smoke], WEB.specRoot)).not.toThrow()
    expect(() => validateRuleSpecs(rule, SPECS, WEB.specRoot)).toThrow('matches no spec')
  })

  test('the web target keys test type on the .anvil. infix', () => {
    expect(WEB.testTypeOf('a/b.anvil.e2e.test.ts')).toBe('anvil')
    expect(WEB.testTypeOf('a/b.e2e.test.ts')).toBe('non-anvil')
    expect(WEB.isSpec('a/b.e2e.test.ts')).toBe(true)
    expect(WEB.isSpec('a/b.test.ts')).toBe(false)
  })

  test('resolveTarget rejects an unknown name and applies env overrides', () => {
    expect(() => resolveTarget('desktop')).toThrow('unknown TARGET desktop')
    expect(resolveTarget('web').mapPath).toBe('apps/web/src/playwright/e2e-affected.json')
    expect(resolveTarget('web', { mapPath: 'tmp/map.json', specRoot: 'tmp/specs' })).toMatchObject({
      name: 'web',
      mapPath: 'tmp/map.json',
      specRoot: 'tmp/specs',
    })
  })

  test('specWeights counts test calls, including skipped ones, with a floor of 1', () => {
    const weights = specWeights(['one', 'none'], (spec) =>
      spec === 'one'
        ? "test('a', () => {})\n  test.skip('b', () => {})\n  test.fixme('c', () => {})\n"
        : 'describe only',
    )
    expect(weights).toEqual({ one: 3, none: 1 })
  })

  test('unstable specs are withheld from area, rule and full selection, but a changed one runs', () => {
    const unstableSpec = 'apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts'
    const unstable = [unstableSpec]
    const stable = SPECS.filter((spec) => spec !== unstableSpec)
    const withUnstable = (changedFiles: string[]) =>
      selectSpecs({
        target: WEB,
        runAll: false,
        changedFiles,
        specs: stable,
        unstableSpecs: unstable,
        dependencyRoots: WEB_DEPS,
        projectRoots: ROOTS,
        map: MAP,
      })
    const area = withUnstable(['apps/web/src/pages/Swap/Swap/SwapForm.tsx'])
    expect(area.mode).toBe('targeted')
    expect(area.specs).not.toContain(unstableSpec)
    const rule = withUnstable(['packages/uniswap/src/features/transactions/swap/hooks.ts'])
    expect(rule.specs).not.toContain(unstableSpec)
    const full = withUnstable(['packages/ui/src/theme.ts'])
    expect(full.mode).toBe('full')
    expect(full.specs).toEqual(stable)
    const edited = withUnstable([unstableSpec])
    expect(edited.mode).toBe('targeted')
    expect(edited.specs).toEqual(unstable)
    expect(edited.reasons[0]).toContain('withheld as unstable or broken')
  })

  test('withhold rejects a spec listed as both unstable and broken, by name', () => {
    expect(() =>
      withhold(SPECS, { unstable: ['pages/Swap/Send/'], broken: ['pages/Swap/Send/'] }, 'apps/web/src'),
    ).toThrow('entry is in both unstable and broken: pages/Swap/Send/')
  })

  test('withholdUnstable splits the list and rejects an entry that matches nothing', () => {
    const split = withholdUnstable(
      SPECS,
      ['pages/Swap/Swap/TokenSelector.e2e.test.ts', 'pages/Swap/Send/'],
      'apps/web/src',
    )
    expect(split.unstable).toEqual([
      'apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts',
      'apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts',
    ])
    expect(split.specs).toHaveLength(SPECS.length - 2)
    expect(split.specs).not.toContain('apps/web/src/pages/Swap/Swap/TokenSelector.e2e.test.ts')
    expect(() => withholdUnstable(SPECS, ['pages/Swap/Swap/Renamed.e2e.test.ts'], 'apps/web/src')).toThrow(
      'matches no spec',
    )
  })

  test('listSpecs walks the tree, keeps only what the predicate accepts and honours exclude', () => {
    const dir = mkdtempSync(join(tmpdir(), 'e2e-affected-'))
    try {
      mkdirSync(join(dir, 'pages', 'Swap'), { recursive: true })
      writeFileSync(join(dir, 'pages', 'App.smoketest.e2e.test.ts'), '')
      writeFileSync(join(dir, 'pages', 'Swap', 'Swap.e2e.test.ts'), '')
      writeFileSync(join(dir, 'pages', 'Swap', 'Swap.test.ts'), '')
      writeFileSync(join(dir, 'pages', 'Swap', 'flow.yaml'), '')
      expect(listSpecs(dir, ['pages/App.smoketest.e2e.test.ts'])).toEqual([
        join(dir, 'pages', 'Swap', 'Swap.e2e.test.ts'),
      ])
      expect(listSpecs(dir, [], (path) => path.endsWith('.yaml'))).toEqual([join(dir, 'pages', 'Swap', 'flow.yaml')])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
