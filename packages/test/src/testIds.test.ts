import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { TestID } from './testIds'

/**
 * Ids reached only from Maestro YAML, which reads them as raw strings via the
 * map `generateTestIds.ts` emits. Maestro cannot import TypeScript, so these
 * can never be referenced as `TestID.*`.
 */
const MAESTRO_ONLY = ['ExploreFilterChainAll', 'SearchTokensAndWallets']

/**
 * Unreferenced TestIds we want the usage checker test to ignore.
 * TODO: Remove when #40887 lands.
 */
const USAGE_CHECK_EXCEPTIONS = [
  'MarginAddCta',
  'MarginAdjustBeforeAfterBlock',
  'MarginAdjustBeforeAfterSkeleton',
  'MarginAdjustLockLeverage',
  'MarginAdjustPositionCta',
  'MarginChangeLeverageCta',
  'MarginChartGlossaryClose',
  'MarginChartLegendChip',
  'MarginChartLegendStaleDot',
  'MarginChartSettingsGear',
  'MarginChartSettingsGlossaryLink',
  'MarginChartSkeleton',
  'MarginChartStyleCandles',
  'MarginChartStyleLine',
  'MarginChartZoomIn',
  'MarginChartZoomOut',
  'MarginChartZoomReset',
  'MarginEntryPriceTrigger',
  'MarginEquityTrigger',
  'MarginEstPnlTrigger',
  'MarginMarketsEmpty',
  'MarginMarketsError',
  'MarginMarketsLoading',
  'MarginModalTitle',
  'MarginPairRow',
  'MarginPnlHeaderInfo',
  'MarginPnlSuppressed',
  'MarginPnlTrigger',
  'MarginPositionVenueExcluded',
  'MarginRealizedTrigger',
  'MarginReviewRouteChanged',
  'MarginRoutedVenueChip',
  'MarginShowMoreQuoteRows',
  'MarginVenueDefaultToggle',
  'MarginVenueLogo',
  'MarginVenueRow',
  'MarginVenuesEmpty',
  'MarginVenuesNotice',
  'MarginVenuesSettingsEntry',
  'MarginWithdrawCta',
]

const ALLOWED_UNUSED = new Set([...MAESTRO_ONLY, ...USAGE_CHECK_EXCEPTIONS])

let cachedKeys: Set<string> | undefined

// `git grep` over the whole repo, rather than a package dependency, because
// `@universe/test` sits below every consumer: it cannot import them. Memoized
// lazily so the scan runs once across the tests that need it.
function referencedKeys(): Set<string> {
  if (cachedKeys) {
    return cachedKeys
  }

  const output = execFileSync(
    'git',
    [
      'grep',
      '-hoE',
      // Include files not yet staged, so adding an id and its first consumer
      // in one go does not read as unused. `--untracked` is rejected while
      // `submodule.recurse` is on, which this repo sets.
      '--no-recurse-submodules',
      '--untracked',
      String.raw`TestID\.[A-Za-z0-9_]+|TestID\[['"][A-Za-z0-9_]+['"]\]|testIds\.[A-Za-z0-9_]+`,
      '--',
      ':!packages/test/src/testIds.ts',
      ':!packages/test/src/testIds.test.ts',
    ],
    {
      cwd: execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(),
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  )

  const keys = new Set<string>()
  for (const line of output.split('\n')) {
    const match = /(?:TestID|testIds)(?:\.([A-Za-z0-9_]+)|\[['"]([A-Za-z0-9_]+)['"]\])/.exec(line)
    if (match) {
      keys.add(match[1] ?? (match[2] as string))
    }
  }
  cachedKeys = keys
  return keys
}

describe('TestID', () => {
  // Two keys sharing a value make `getByTestId` ambiguous and silently couple
  // unrelated surfaces, so the map is only useful while every value is unique.
  it('maps every key to a unique value', () => {
    const keysByValue = new Map<string, string[]>()
    for (const [key, value] of Object.entries(TestID)) {
      keysByValue.set(value, [...(keysByValue.get(value) ?? []), key])
    }

    const duplicates = [...keysByValue.entries()]
      .filter(([, keys]) => keys.length > 1)
      .map(([value, keys]) => `${value} <- ${keys.join(', ')}`)

    expect(duplicates).toEqual([])
  })

  it('defines no id that nothing references', () => {
    const referenced = referencedKeys()
    const unused = Object.keys(TestID).filter((key) => !referenced.has(key) && !ALLOWED_UNUSED.has(key))

    expect(unused).toEqual([])
  })

  // Without this the allowlist silently becomes a graveyard.
  it('has no stale allowlist entries', () => {
    const referenced = referencedKeys()
    const stale = [...ALLOWED_UNUSED].filter((key) => !(key in TestID) || referenced.has(key))

    expect(stale).toEqual([])
  })
})
