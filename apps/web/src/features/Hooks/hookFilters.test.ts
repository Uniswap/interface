import { HOOK_FIXTURES } from '~/features/Hooks/fixtures'
import {
  countActiveHookFilters,
  EMPTY_HOOK_FILTER_STATE,
  getActiveHookFilters,
  matchesHookFilters,
} from '~/features/Hooks/hookFilters'
import { type Hook, HookRoutingStatus, HookSourceVerification } from '~/features/Hooks/types'

const hook = HOOK_FIXTURES[0]!

function withTvl(tvlUsd: number | null): Hook {
  return { ...hook, metrics: { ...hook.metrics, tvlUsd } }
}

describe('Hooks filters', () => {
  it('leaves unknown facts unrestricted until their positive filter is enabled', () => {
    const unknown: Hook = {
      ...hook,
      hasMetadata: null,
      deployments: [
        {
          ...hook.deployments[0],
          routingStatus: HookRoutingStatus.Unknown,
          sourceVerification: HookSourceVerification.Unknown,
        },
      ],
    }

    expect(matchesHookFilters(unknown, EMPTY_HOOK_FILTER_STATE)).toBe(true)
    expect(matchesHookFilters(unknown, { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true })).toBe(false)
    expect(matchesHookFilters(unknown, { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true })).toBe(false)
    expect(matchesHookFilters(unknown, { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true })).toBe(false)
    expect(unknown.hasMetadata).toBeNull()
    expect(unknown.deployments[0].sourceVerification).toBe(HookSourceVerification.Unknown)
  })

  it('combines independent positive criteria instead of treating verification as routing or metadata', () => {
    const sourceOnly: Hook = {
      ...hook,
      hasMetadata: false,
      deployments: [{ ...hook.deployments[0], routingStatus: HookRoutingStatus.Unsupported }],
    }
    const routedOnly: Hook = {
      ...hook,
      deployments: [{ ...hook.deployments[0], sourceVerification: HookSourceVerification.Unverified }],
    }
    const all = {
      ...EMPTY_HOOK_FILTER_STATE,
      routedOnly: true,
      verifiedSourceOnly: true,
      metadataOnly: true,
    }

    expect(matchesHookFilters(hook, { ...all, tvlRange: { min: 10_000_000 } })).toBe(true)
    expect(matchesHookFilters(sourceOnly, { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true })).toBe(true)
    expect(matchesHookFilters(sourceOnly, { ...all, tvlRange: { min: 10_000_000 } })).toBe(false)
    expect(matchesHookFilters(routedOnly, { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true })).toBe(true)
    expect(matchesHookFilters(routedOnly, { ...all, tvlRange: { min: 10_000_000 } })).toBe(false)
    expect(
      matchesHookFilters({ ...hook, hasMetadata: false }, { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true }),
    ).toBe(false)
  })

  it('accepts confirmed descriptive metadata without requiring a name', () => {
    expect(
      matchesHookFilters(
        { ...hook, name: null, hasMetadata: true },
        { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
      ),
    ).toBe(true)
  })

  it.each([HookRoutingStatus.Unsupported, HookRoutingStatus.Unknown])(
    'accepts either supported deployment in a mixed %s group',
    (routingStatus) => {
      const supported = hook.deployments[0]
      const other = { ...hook.deployments[1]!, routingStatus }
      for (const deployments of [
        [supported, other],
        [other, supported],
      ] as const) {
        const mixed: Hook = { ...hook, deployments }
        expect(matchesHookFilters(mixed, { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true })).toBe(true)
        expect(matchesHookFilters(mixed, { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true })).toBe(true)
      }
    },
  )

  it.each([
    [HookRoutingStatus.Unsupported, HookRoutingStatus.Unsupported],
    [HookRoutingStatus.Unsupported, HookRoutingStatus.Unknown],
    [HookRoutingStatus.Unknown, HookRoutingStatus.Unsupported],
    [HookRoutingStatus.Unknown, HookRoutingStatus.Unknown],
  ])('excludes groups without any supported deployment (%s, %s)', (first, second) => {
    const unsupported: Hook = {
      ...hook,
      deployments: [
        { ...hook.deployments[0], routingStatus: first },
        { ...hook.deployments[1]!, routingStatus: second },
      ],
    }

    expect(matchesHookFilters(unsupported, { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true })).toBe(false)
    expect(matchesHookFilters(unsupported, { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true })).toBe(true)
  })

  it.each([HookSourceVerification.Unverified, HookSourceVerification.Unknown])(
    'does not qualify a mixed %s source group from one verified deployment',
    (sourceVerification) => {
      const verified = hook.deployments[0]
      const other = { ...hook.deployments[1]!, sourceVerification }
      for (const deployments of [
        [verified, other],
        [other, verified],
      ] as const) {
        const mixed: Hook = { ...hook, deployments }
        expect(matchesHookFilters(mixed, { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true })).toBe(false)
        expect(matchesHookFilters(mixed, { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true })).toBe(true)
      }
    },
  )

  it.each([
    { min: undefined, max: 100_000 },
    { min: 100_000, max: 1_000_000 },
    { min: 10_000_000, max: undefined },
  ])('uses inclusive minima and exclusive maxima for %j', (range) => {
    const { min, max } = range
    if (min !== undefined) {
      expect(matchesHookFilters(withTvl(min), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: range })).toBe(true)
      expect(matchesHookFilters(withTvl(min - 1), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: range })).toBe(false)
    }
    if (max !== undefined) {
      expect(matchesHookFilters(withTvl(max - 1), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: range })).toBe(true)
      expect(matchesHookFilters(withTvl(max), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: range })).toBe(false)
    }
    expect(matchesHookFilters(withTvl(null), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: range })).toBe(false)
  })

  it('retains the designed TVL gap and distinguishes an unavailable value from zero', () => {
    const ranges = [{ max: 100_000 }, { min: 100_000, max: 1_000_000 }, { min: 10_000_000 }]
    for (const tvl of [1_000_000, 5_500_000]) {
      expect(
        ranges.some((range) => matchesHookFilters(withTvl(tvl), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: range })),
      ).toBe(false)
    }
    expect(matchesHookFilters(withTvl(0), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: { max: 100_000 } })).toBe(true)
    expect(matchesHookFilters(withTvl(null), EMPTY_HOOK_FILTER_STATE)).toBe(true)
    expect(matchesHookFilters(withTvl(Number.NaN), { ...EMPTY_HOOK_FILTER_STATE, tvlRange: { max: 100_000 } })).toBe(
      false,
    )
  })

  it('counts advanced categories only and supplies stable identifiers for their applied values', () => {
    expect(countActiveHookFilters(EMPTY_HOOK_FILTER_STATE)).toBe(0)
    const filters = {
      tvlBucketId: '100k-1m' as const,
      routedOnly: true,
      verifiedSourceOnly: true,
      metadataOnly: true,
    }
    expect(getActiveHookFilters(filters)).toEqual(['tvl:100k-1m', 'routed', 'verified_source', 'metadata'])
    expect(countActiveHookFilters(filters)).toBe(4)
  })
})
