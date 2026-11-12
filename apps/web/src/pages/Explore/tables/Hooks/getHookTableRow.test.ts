import { UniverseChainId } from '@universe/chains'
import { ALL_NETWORKS_LABEL } from 'uniswap/src/features/telemetry/types'
import { OrderDirection } from '~/data/util'
import { HOOK_FIXTURES } from '~/features/Hooks/fixtures'
import { DEFAULT_HOOK_LIST_OPTIONS } from '~/features/Hooks/hookListOptions'
import { type Hook, HookSortField } from '~/features/Hooks/types'
import { getHookTableRow } from '~/pages/Explore/tables/Hooks/getHookTableRow'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'

function fixture(id: string): Hook {
  const hook = HOOK_FIXTURES.find((candidate) => candidate.id === id)
  if (!hook) {
    throw new Error(`Missing Hooks test fixture ${id}`)
  }
  return hook
}

function makeRow(
  hook: Hook,
  options: Partial<Omit<Parameters<typeof getHookTableRow>[0], 'hook' | 'getTrustedProvenance'>> = {},
): HookTableRow | undefined {
  return getHookTableRow({
    ...DEFAULT_HOOK_LIST_OPTIONS,
    hook,
    position: 3,
    getTrustedProvenance: () => undefined,
    searchParams: new URLSearchParams(),
    ...options,
  })
}

describe('getHookTableRow', () => {
  it('opens an address-matched deployment while retaining aggregate metrics, networks and the opaque group ID', () => {
    const hook = fixture('hk_7b8a2e')
    const original = structuredClone(hook)
    const result = makeRow(hook, { search: '  0x2222222222222222222222222222222222222222  ' })

    expect(result).toMatchObject({
      id: 'hk_7b8a2e',
      address: '0x2222222222222222222222222222222222222222',
      chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
      href: '/explore/hooks/base/0x2222222222222222222222222222222222222222?hookReferrer=list',
      pools: 36,
      volume: 14_200_000,
      tvl: 38_500_000,
      analytics: {
        properties: {
          hook_address: '0x2222222222222222222222222222222222222222',
          chain: ALL_NETWORKS_LABEL,
          chain_id: UniverseChainId.Base,
          position: 3,
          sort: 'volume_1d_desc',
        },
      },
    })
    expect(hook).toEqual(original)
  })

  it.each([
    {
      period: '1d',
      sortField: HookSortField.Volume,
      sortDirection: OrderDirection.Desc,
      volume: 14_200_000,
      sort: 'volume_1d_desc',
    },
    {
      period: '7d',
      sortField: HookSortField.Volume,
      sortDirection: OrderDirection.Asc,
      volume: 92_100_000,
      sort: 'volume_7d_asc',
    },
    {
      period: '30d',
      sortField: HookSortField.Volume,
      sortDirection: OrderDirection.Desc,
      volume: 351_400_000,
      sort: 'volume_30d_desc',
    },
    {
      period: '7d',
      sortField: HookSortField.Tvl,
      sortDirection: OrderDirection.Desc,
      volume: 92_100_000,
      sort: 'tvl_desc',
    },
    {
      period: '30d',
      sortField: HookSortField.Pools,
      sortDirection: OrderDirection.Asc,
      volume: 351_400_000,
      sort: 'pools_asc',
    },
  ] as const)(
    'uses $period volume and the actual $sortField $sortDirection ordering context',
    ({ period, sortField, sortDirection, volume, sort }) => {
      const result = makeRow(fixture('hk_7b8a2e'), { period, sortField, sortDirection })

      expect(result?.volume).toBe(volume)
      expect(result?.analytics.properties.sort).toBe(sort)
    },
  )

  it('reports the URL network filter separately from the numeric destination chain and drops list-only parameters', () => {
    const result = makeRow(fixture('hk_7b8a2e'), {
      chainId: UniverseChainId.Base,
      searchParams: new URLSearchParams({
        featureFlagOverride: 'hooks_explore_ux',
        lng: 'en-US',
        chain: 'ethereum',
        hookSearch: 'Angstrom',
        hookSort: 'tvl',
        hookSortDirection: 'asc',
        hooksFixtureScenario: 'default',
      }),
    })

    expect(result?.analytics.properties).toMatchObject({ chain: 'base', chain_id: UniverseChainId.Base })
    expect(result?.href).toBe(
      '/explore/hooks/base/0x2222222222222222222222222222222222222222?hookReferrer=list&featureFlagOverride=hooks_explore_ux&lng=en-US',
    )
  })

  it('keeps real zero, unavailable values and custom-accounting volume distinct for every selected period', () => {
    for (const period of ['1d', '7d', '30d'] as const) {
      expect(makeRow(fixture('hk_f03d72'), { period })).toMatchObject({ volume: 0, tvl: 0, pools: 0 })
      expect(makeRow(fixture('hk_2d15bf'), { period })).toMatchObject({ volume: null, tvl: null, pools: null })
      expect(makeRow(fixture('hk_a93c10'), { period })).toMatchObject({ volume: null, customAccounting: true })
    }
  })

  it('returns no row when the destination is absent from the selected network or exact address', () => {
    const hook = fixture('hk_7b8a2e')

    expect(makeRow(hook, { chainId: UniverseChainId.ArbitrumOne })).toBeUndefined()
    expect(makeRow(hook, { search: '0xffffffffffffffffffffffffffffffffffffffff' })).toBeUndefined()
  })
})
