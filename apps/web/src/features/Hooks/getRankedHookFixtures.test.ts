import { UniverseChainId } from '@universe/chains'
import { describe, expect, it } from 'vitest'
import { OrderDirection } from '~/data/util'
import { HOOK_FIXTURES } from '~/features/Hooks/fixtures'
import { getRankedHookFixtures } from '~/features/Hooks/getRankedHookFixtures'
import { EMPTY_HOOK_FILTER_STATE } from '~/features/Hooks/hookFilters'
import { DEFAULT_HOOK_LIST_OPTIONS } from '~/features/Hooks/hookListOptions'
import {
  type Hook,
  HookAccounting,
  type HookMetrics,
  HookRoutingStatus,
  HookSortField,
  HookSourceVerification,
} from '~/features/Hooks/types'

function fixture({
  id,
  volumeUsd,
  tvlUsd = 100,
  poolCount = 1,
  accounting = HookAccounting.Standard,
}: {
  id: string
  volumeUsd: HookMetrics['volumeUsd']
  tvlUsd?: number | null
  poolCount?: number | null
  accounting?: HookAccounting
}): Hook {
  const base = HOOK_FIXTURES[0]!
  const metrics = { ...base.metrics, volumeUsd, tvlUsd, poolCount }
  return {
    ...base,
    id,
    name: id,
    metrics,
    deployments: [{ ...base.deployments[0], accounting, metrics }],
  }
}

describe('getRankedHookFixtures', () => {
  const fixtures = [
    fixture({ id: 'a', volumeUsd: { '1d': 10, '7d': 100, '30d': 1000 }, poolCount: 3 }),
    fixture({ id: 'b', volumeUsd: { '1d': 20, '7d': 50, '30d': 2000 }, tvlUsd: 200 }),
    fixture({ id: 'zero-volume', volumeUsd: { '1d': 0, '7d': 5, '30d': 8 }, tvlUsd: 999, poolCount: 10 }),
    fixture({ id: 'zero-tvl', volumeUsd: { '1d': 999, '7d': 999, '30d': 999 }, tvlUsd: 0, poolCount: 15 }),
    fixture({ id: 'zero-activity', volumeUsd: { '1d': 0, '7d': 0, '30d': 0 }, tvlUsd: 0, poolCount: 0 }),
    fixture({
      id: 'unavailable',
      volumeUsd: { '1d': null, '7d': null, '30d': null },
      tvlUsd: null,
      poolCount: null,
    }),
    fixture({
      id: 'custom',
      volumeUsd: { '1d': 1_000_000, '7d': 1_000_000, '30d': 1_000_000 },
      tvlUsd: 500,
      poolCount: 5,
      accounting: HookAccounting.Custom,
    }),
  ]

  it.each([
    [
      HookSortField.Volume,
      OrderDirection.Desc,
      ['b', 'a', 'zero-tvl', 'zero-activity', 'zero-volume', 'custom', 'unavailable'],
    ],
    [
      HookSortField.Volume,
      OrderDirection.Asc,
      ['a', 'b', 'zero-tvl', 'zero-activity', 'zero-volume', 'custom', 'unavailable'],
    ],
    [
      HookSortField.Tvl,
      OrderDirection.Desc,
      ['custom', 'b', 'a', 'zero-volume', 'zero-activity', 'zero-tvl', 'unavailable'],
    ],
    [
      HookSortField.Tvl,
      OrderDirection.Asc,
      ['a', 'b', 'custom', 'zero-volume', 'zero-activity', 'zero-tvl', 'unavailable'],
    ],
    [
      HookSortField.Pools,
      OrderDirection.Desc,
      ['custom', 'a', 'b', 'zero-tvl', 'zero-volume', 'zero-activity', 'unavailable'],
    ],
    [
      HookSortField.Pools,
      OrderDirection.Asc,
      ['b', 'a', 'custom', 'zero-volume', 'zero-tvl', 'zero-activity', 'unavailable'],
    ],
  ] as const)('ranks %s %s while putting inactive and unavailable values last', (sortField, sortDirection, ids) => {
    expect(
      getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures, sortField, sortDirection }).map(
        (hook) => hook.id,
      ),
    ).toEqual(ids)
  })

  it('uses the selected volume period for both ranking and inactivity', () => {
    const day = getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures, period: '1d' })
    const week = getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures, period: '7d' })
    const month = getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures, period: '30d' })

    expect(day.slice(0, 3).map((hook) => hook.id)).toEqual(['b', 'a', 'zero-tvl'])
    expect(week.slice(0, 3).map((hook) => hook.id)).toEqual(['a', 'b', 'zero-volume'])
    expect(month.slice(0, 3).map((hook) => hook.id)).toEqual(['b', 'a', 'zero-volume'])
  })

  it('matches name prefixes independently of casing and surrounding whitespace', () => {
    expect(
      getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures, search: '  ZeRo-VoL  ' }).map((hook) => hook.id),
    ).toEqual(['zero-volume'])
    expect(getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures, search: 'volume' })).toEqual([])
  })

  it('retains zero activity while keeping unavailable volume distinct from zero', () => {
    const zero = { '1d': 0, '7d': 0, '30d': 0 }
    const candidates = [
      fixture({ id: 'zero-activity', volumeUsd: zero, tvlUsd: 0 }),
      fixture({ id: 'history', volumeUsd: { ...zero, '30d': 1 }, tvlUsd: 0 }),
      fixture({ id: 'missing-volume', volumeUsd: { ...zero, '7d': null }, tvlUsd: 0 }),
      fixture({ id: 'missing-tvl', volumeUsd: zero, tvlUsd: null }),
      fixture({ id: 'custom-zero', volumeUsd: zero, tvlUsd: 0, accounting: HookAccounting.Custom }),
    ]

    expect(
      getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures: candidates }).map((hook) => hook.id),
    ).toEqual(['history', 'missing-tvl', 'missing-volume', 'zero-activity', 'custom-zero'])
    expect(
      getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures: candidates, search: 'zero-' }).map(
        (hook) => hook.id,
      ),
    ).toEqual(['zero-activity'])
  })

  it('keeps zero activity after network scoping and restricts exact lookup to the selected network', () => {
    const active = fixture({ id: 'multi-chain', volumeUsd: { '1d': 10, '7d': 100, '30d': 1000 } })
    const zero = fixture({ id: 'zero', volumeUsd: { '1d': 0, '7d': 0, '30d': 0 }, tvlUsd: 0 })
    const zeroDeployment = {
      ...zero.deployments[0],
      chainId: UniverseChainId.Base,
      address: '0xabcdef123456789012345678901234567890abcd',
    }
    const group: Hook = { ...active, deployments: [active.deployments[0], zeroDeployment] }

    expect(getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures: [group] })).toEqual([group])
    expect(
      getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures: [group], chainId: UniverseChainId.Base }),
    ).toEqual([{ ...group, deployments: [zeroDeployment], metrics: zeroDeployment.metrics }])
    const lookup = getRankedHookFixtures({
      ...DEFAULT_HOOK_LIST_OPTIONS,
      fixtures: [group],
      chainId: UniverseChainId.Base,
      search: '  0xABCDEF123456789012345678901234567890ABCD  ',
    })
    expect(lookup).toEqual([{ ...group, deployments: [zeroDeployment], metrics: zeroDeployment.metrics }])
    expect(
      getRankedHookFixtures({
        ...DEFAULT_HOOK_LIST_OPTIONS,
        fixtures: [group],
        chainId: UniverseChainId.Mainnet,
        search: zeroDeployment.address,
      }),
    ).toEqual([])
  })

  it('keeps opaque groups and complete aggregate objects for all-network exact-address results', () => {
    const snapshot = structuredClone(HOOK_FIXTURES)
    const angstrom = HOOK_FIXTURES.find((hook) => hook.id === 'hk_7b8a2e')!
    const baseAddress = getRankedHookFixtures({
      ...DEFAULT_HOOK_LIST_OPTIONS,
      fixtures: HOOK_FIXTURES,
      search: '0x2222222222222222222222222222222222222222',
    })
    const sharedAddress = getRankedHookFixtures({
      ...DEFAULT_HOOK_LIST_OPTIONS,
      fixtures: HOOK_FIXTURES,
      search: '0x1111111111111111111111111111111111111111',
    })

    expect(baseAddress).toEqual([angstrom])
    expect(baseAddress[0]).toBe(angstrom)
    expect(baseAddress[0]?.deployments).toHaveLength(2)
    expect(baseAddress[0]?.metrics).toMatchObject({ tvlUsd: 38_500_000, volumeUsd: { '1d': 14_200_000 } })
    expect(sharedAddress.map((hook) => hook.id)).toEqual(['hk_7b8a2e', 'hk_f03d72'])
    expect(sharedAddress[1]?.name).toBeNull()
    expect(HOOK_FIXTURES).toEqual(snapshot)
  })

  it('breaks metric ties with stable opaque group IDs independently of input order and sort direction', () => {
    const b = fixture({ id: 'opaque-b', volumeUsd: { '1d': 10, '7d': 10, '30d': 10 } })
    const a = { ...b, id: 'opaque-a' }
    for (const sortDirection of Object.values(OrderDirection)) {
      expect(
        getRankedHookFixtures({ ...DEFAULT_HOOK_LIST_OPTIONS, fixtures: [b, a], sortDirection }).map((hook) => hook.id),
      ).toEqual(['opaque-a', 'opaque-b'])
    }
  })

  it('qualifies status after network projection while preserving complete passing all-network groups', () => {
    const original = HOOK_FIXTURES[0]!
    const mixed: Hook = {
      ...original,
      deployments: [
        original.deployments[0],
        {
          ...original.deployments[1]!,
          sourceVerification: HookSourceVerification.Unknown,
          routingStatus: HookRoutingStatus.Unsupported,
        },
      ],
    }
    const filters = { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true, verifiedSourceOnly: true }
    const options = { ...DEFAULT_HOOK_LIST_OPTIONS, fixtures: [mixed], filters }

    expect(getRankedHookFixtures(options)).toEqual([])
    expect(getRankedHookFixtures({ ...options, chainId: UniverseChainId.Base })).toEqual([])
    expect(getRankedHookFixtures({ ...options, chainId: UniverseChainId.Mainnet })).toEqual([
      { ...mixed, deployments: [mixed.deployments[0]], metrics: mixed.deployments[0].metrics },
    ])
    const complete = getRankedHookFixtures({ ...options, fixtures: [original] })
    expect(complete).toEqual([original])
    expect(complete[0]).toBe(original)
    expect(complete[0]?.deployments).toHaveLength(2)
    expect(mixed.deployments).toHaveLength(2)
  })

  it('keeps exact-address lookup subject to explicit TVL or status criteria', () => {
    const zero = HOOK_FIXTURES.find((hook) => hook.id === 'hk_f03d72')!
    const options = {
      ...DEFAULT_HOOK_LIST_OPTIONS,
      fixtures: [zero],
      search: zero.deployments[0].address,
      chainId: zero.deployments[0].chainId,
    }
    expect(
      getRankedHookFixtures({ ...options, filters: { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true } }),
    ).toHaveLength(1)
    expect(getRankedHookFixtures({ ...options, tvlRange: { min: 10_000_000 } })).toEqual([])
    for (const filters of [
      { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true },
      { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
    ]) {
      expect(getRankedHookFixtures({ ...options, filters })).toEqual([])
    }
  })
})
