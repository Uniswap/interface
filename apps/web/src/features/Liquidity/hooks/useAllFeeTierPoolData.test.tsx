import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { type Currency, Percent } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { DAI, USDC_MAINNET, USDT } from 'uniswap/src/constants/tokens'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { usePoolLookupTokenAddresses } from '~/features/Liquidity/hooks/usePoolLookupTokenAddresses'
import { useV4PoolsInitializedOnChain } from '~/features/Liquidity/hooks/useV4PoolsInitializedOnChain'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'

const { mockUseInfiniteQuery } = vi.hoisted(() => ({
  mockUseInfiniteQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useInfiniteQuery: mockUseInfiniteQuery,
}))

// Pass the input through so tests can assert on the params/enabled the hook builds.
vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: (input: unknown): unknown => input,
}))

// The on-chain existence check (wagmi) is covered separately; default it to "no unavailable pools" here
// so these tests focus on indexed-data merging without needing a WagmiProvider.
vi.mock('~/features/Liquidity/hooks/useV4PoolsInitializedOnChain', () => ({
  useV4PoolsInitializedOnChain: vi.fn(() => ({
    unavailableFeeTierKeys: new Set(),
    isLoading: false,
    isError: false,
  })),
}))

// Adapter mapping (permissioned pairs) is covered in usePoolLookupTokenAddresses.test.ts;
// pass displayed addresses through so these tests need no QueryClientProvider.
const passThroughLookup = vi.hoisted(
  () =>
    ({ token0, token1 }: { token0: Maybe<Currency>; token1: Maybe<Currency> }) => ({
      lookupAddress0: token0?.isToken ? token0.address : undefined,
      lookupAddress1: token1?.isToken ? token1.address : undefined,
      orientationFlipped: false,
      isLoading: false,
    }),
)

vi.mock('~/features/Liquidity/hooks/usePoolLookupTokenAddresses', () => ({
  usePoolLookupTokenAddresses: vi.fn(passThroughLookup),
}))

const DEFAULT_FEE_TIER_DATA = {
  '100-1': {
    fee: { feeAmount: 100, tickSpacing: 1, isDynamic: false },
    formattedFee: '0.01%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
  '500-10': {
    fee: { feeAmount: 500, tickSpacing: 10, isDynamic: false },
    formattedFee: '0.05%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
  '3000-60': {
    fee: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
    formattedFee: '0.30%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
  '10000-200': {
    fee: { feeAmount: 10000, tickSpacing: 200, isDynamic: false },
    formattedFee: '1%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
}

describe('useAllFeeTierPoolData', () => {
  const chainId = UniverseChainId.Mainnet
  const protocolVersion = ProtocolVersion.V3
  const sdkCurrencies = { TOKEN0: TEST_TOKEN_1, TOKEN1: TEST_TOKEN_2 }
  const hook = ''

  // A data.v2 ListPools `RankedPool`, the only pool source now. feeTier/tickSpacing/rewardApr are
  // optional so tests can omit them, matching the wire shape: ListPools omits feeTier for a
  // dynamic-fee pool, a keyless pool can't key into a tier, and a rewardless pool has no boostedApr.
  const rankedPool = ({
    poolId,
    feeTier,
    tickSpacing,
    isDynamicFee = false,
    tvl,
    rewardApr,
    tokenBoosts,
    hookAddress,
  }: {
    poolId: string
    feeTier?: number
    tickSpacing?: number
    isDynamicFee?: boolean
    tvl: number
    rewardApr?: number
    tokenBoosts?: Record<string, unknown>[]
    hookAddress?: string
  }): Record<string, unknown> => ({
    pool: {
      poolId,
      chainId,
      protocolVersion,
      token0: { address: DAI.address, chainId },
      token1: { address: USDT.address, chainId },
      feeTier,
      tickSpacing,
      isDynamicFee,
      hookAddress,
    },
    stats: { tvl, rewardApr, tokenBoosts },
  })

  const listPools = (pools: Record<string, unknown>[]) => ({ data: { pages: [{ pools }] }, isLoading: false })

  beforeEach(() => {
    vi.mocked(usePoolLookupTokenAddresses).mockImplementation(passThroughLookup)
    mockUseInfiniteQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty feeTierData and hasExistingFeeTiers false if no pool data', () => {
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
      isLoading: false,
      isError: false,
    })
  })

  it('returns correct feeTierData for a single pool', () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([rankedPool({ poolId: 'pool1', feeTier: 500, tickSpacing: 60, tvl: 1000, rewardApr: 0.1 })]),
    )
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: {
        ...DEFAULT_FEE_TIER_DATA,
        '500-60': {
          id: 'pool1',
          fee: {
            feeAmount: 500,
            isDynamic: false,
            tickSpacing: 60,
          },
          formattedFee: '0.05%',
          totalLiquidityUsd: 1000,
          percentage: new Percent(1000, 1000),
          tvl: '1000',
          created: true,
          boostedApr: 0.1,
          rewards: [],
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
      isError: false,
    })
  })

  // The tier's reward badges denominate each boost in the token paying it, so the served
  // `token_boosts` have to reach `FeeTierData` — a bare `rewardApr` names nothing.
  it("carries the served reward tokens onto the tier's rewards", () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({
          poolId: 'pool1',
          feeTier: 500,
          tickSpacing: 60,
          tvl: 1000,
          rewardApr: 6.5,
          tokenBoosts: [
            { token: { chainId, address: DAI.address, symbol: 'DAI', decimals: 18, isNative: false }, apr: 4.5 },
            // A zero-APR boost is an ended campaign: no yield to badge, so it earns no entry.
            { token: { chainId, address: USDT.address, symbol: 'USDT', decimals: 6, isNative: false }, apr: 0 },
            { token: { chainId, address: USDC_MAINNET.address, symbol: 'USDC', decimals: 6, isNative: false }, apr: 2 },
          ],
        }),
      ]),
    )
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current.feeTierData['500-60']?.rewards).toEqual([
      { token: { chainId, address: DAI.address, symbol: 'DAI', decimals: 18, isNative: false }, boostedPoolApr: 4.5 },
      {
        token: { chainId, address: USDC_MAINNET.address, symbol: 'USDC', decimals: 6, isNative: false },
        boostedPoolApr: 2,
      },
    ])
  })

  it('renders dust tvl as a plain decimal, not exponential notation', () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([rankedPool({ poolId: 'pool1', feeTier: 500, tickSpacing: 60, tvl: 0.0000005 })]),
    )
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current.feeTierData['500-60']?.tvl).toBe('0.0000005')
  })

  it('aggregates pools with the same fee', () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({ poolId: 'pool1', feeTier: 500, tickSpacing: 60, tvl: 1000, rewardApr: 0.1 }),
        rankedPool({ poolId: 'pool2', feeTier: 500, tickSpacing: 60, tvl: 2000, rewardApr: 0.2 }),
      ]),
    )
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: {
        ...DEFAULT_FEE_TIER_DATA,
        '500-60': {
          id: 'pool1',
          fee: {
            feeAmount: 500,
            isDynamic: false,
            tickSpacing: 60,
          },
          formattedFee: '0.05%',
          totalLiquidityUsd: 3000,
          percentage: new Percent(3000, 3000),
          tvl: '1000',
          created: true,
          boostedApr: 0.1,
          rewards: [],
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
      isError: false,
    })
  })

  it('excludes pools that cannot key into a tier from the TVL denominator', () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({ poolId: 'pool1', feeTier: 500, tickSpacing: 60, tvl: 1000 }),
        // Keyless (no tickSpacing): surfaces no tier, so it must not dilute pool1's percentage.
        rankedPool({ poolId: 'pool2', feeTier: 3000, tvl: 9000 }),
      ]),
    )
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current.feeTierData['500-60']?.percentage).toEqual(new Percent(1000, 1000))
    expect(result.current.feeTierData['3000-60']?.created).toBe(false)
  })

  it('handles multiple pools with different fees', () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({ poolId: 'pool1', feeTier: 500, tickSpacing: 60, tvl: 1000, rewardApr: 0.1 }),
        rankedPool({ poolId: 'pool2', feeTier: 3000, tickSpacing: 60, tvl: 2000, rewardApr: 0.2 }),
      ]),
    )
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: {
        ...DEFAULT_FEE_TIER_DATA,
        '500-60': {
          id: 'pool1',
          fee: {
            feeAmount: 500,
            isDynamic: false,
            tickSpacing: 60,
          },
          formattedFee: '0.05%',
          totalLiquidityUsd: 1000,
          percentage: new Percent(1000, 3000),
          tvl: '1000',
          created: true,
          boostedApr: 0.1,
          rewards: [],
        },
        '3000-60': {
          id: 'pool2',
          fee: {
            feeAmount: 3000,
            isDynamic: false,
            tickSpacing: 60,
          },
          formattedFee: '0.30%',
          totalLiquidityUsd: 2000,
          percentage: new Percent(2000, 3000),
          tvl: '2000',
          created: true,
          boostedApr: 0.2,
          rewards: [],
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
      isError: false,
    })
  })

  it('handles dynamic fee tier', () => {
    mockUseInfiniteQuery.mockReturnValue(
      listPools([
        rankedPool({
          poolId: 'pool-dyn',
          // A dynamic-fee pool's served fee IS the v4 dynamic-fee flag, and that is what keys the
          // tier below.
          feeTier: DYNAMIC_FEE_AMOUNT,
          tickSpacing: 60,
          isDynamicFee: true,
          tvl: 5000,
          rewardApr: 0.3,
        }),
      ]),
    )
    const { result } = renderHook(() =>
      useAllFeeTierPoolData({
        chainId,
        protocolVersion,
        sdkCurrencies,
        hook,
        withDynamicFeeTier: true,
      }),
    )
    expect(result.current).toEqual({
      feeTierData: {
        ...DEFAULT_FEE_TIER_DATA,
        [`${DYNAMIC_FEE_AMOUNT}-60`]: {
          id: 'pool-dyn',
          fee: {
            feeAmount: DYNAMIC_FEE_AMOUNT,
            isDynamic: true,
            tickSpacing: 60,
          },
          formattedFee: 'Dynamic fee',
          totalLiquidityUsd: 5000,
          percentage: new Percent(5000, 5000),
          tvl: '5000',
          created: true,
          boostedApr: 0.3,
          rewards: [],
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
      isError: false,
    })
  })

  it('returns hasExistingFeeTiers false if pools array is empty', () => {
    mockUseInfiniteQuery.mockReturnValue(listPools([]))
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
      isLoading: false,
      isError: false,
    })
  })

  it('handles missing tokens gracefully', () => {
    mockUseInfiniteQuery.mockReturnValue(listPools([]))
    const { result } = renderHook(() =>
      useAllFeeTierPoolData({
        chainId,
        protocolVersion,
        sdkCurrencies: { TOKEN0: undefined, TOKEN1: undefined },
        hook,
      }),
    )
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
      isLoading: false,
      isError: false,
    })
  })

  it('should report loading while the permissions address mapping is loading', () => {
    vi.mocked(usePoolLookupTokenAddresses).mockReturnValue({
      lookupAddress0: undefined,
      lookupAddress1: undefined,
      orientationFlipped: false,
      isLoading: true,
    })

    // TEST_TOKEN_1's address doubles as NEW_TOKEN_PLACEHOLDER_ADDRESS, which suppresses fetching
    // (and therefore the loading state), so this test needs real token fixtures.
    const { result } = renderHook(() =>
      useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies: { TOKEN0: DAI, TOKEN1: USDT }, hook }),
    )

    expect(result.current.isLoading).toBe(true)
  })

  describe('data.v2 ListPools request', () => {
    // Real token fixtures: TEST_TOKEN_1's placeholder address suppresses fetching (see above).
    const realCurrencies = { TOKEN0: DAI, TOKEN1: USDT }

    it('omits the server hooks filter for non-V4 requests (it would match nothing)', () => {
      renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies: realCurrencies, hook }))

      const input = mockUseInfiniteQuery.mock.calls.at(-1)?.[0] as { params: { filter: Record<string, unknown> } }
      expect(input.params.filter).not.toHaveProperty('hooks')
    })

    it('sends the zero address as the V4 hookless filter and checksums a provided hook', () => {
      renderHook(() =>
        useAllFeeTierPoolData({
          chainId,
          protocolVersion: ProtocolVersion.V4,
          sdkCurrencies: realCurrencies,
          hook: '',
        }),
      )
      let input = mockUseInfiniteQuery.mock.calls.at(-1)?.[0] as { params: { filter: Record<string, unknown> } }
      expect(input.params.filter).toMatchObject({ hooks: ZERO_ADDRESS })

      renderHook(() =>
        useAllFeeTierPoolData({
          chainId,
          protocolVersion: ProtocolVersion.V4,
          sdkCurrencies: realCurrencies,
          hook: '0xeade493b075cee00e6a832af758b7c76793fe880',
        }),
      )
      input = mockUseInfiniteQuery.mock.calls.at(-1)?.[0] as { params: { filter: Record<string, unknown> } }
      expect(input.params.filter).toMatchObject({ hooks: '0xEADe493b075Cee00e6A832Af758B7c76793FE880' })
    })

    it('queries data.v2 ListPools by pair', () => {
      renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies: realCurrencies, hook }))

      expect(mockUseInfiniteQuery).toHaveBeenCalledWith({
        params: {
          chainIds: [chainId],
          sort: { orderBy: PoolsOrderBy.TVL },
          filter: {
            protocolVersions: [protocolVersion],
            tokenFilter: { tokens: [DAI.address, USDT.address], logicalOperator: PoolTokenLogicalOperator.AND },
            includeSpam: true,
            applyTopLevelFilters: false,
          },
        },
        pageSize: 100,
        enabled: true,
      })
    })

    it('builds feeTierData from the data.v2 response, filtering the hook client-side', () => {
      mockUseInfiniteQuery.mockReturnValue(
        listPools([
          // Matches: hookless via zero address.
          rankedPool({ poolId: 'pool1', feeTier: 500, tickSpacing: 60, tvl: 1000, hookAddress: ZERO_ADDRESS }),
          // Dropped: hooked pool while the request asks for hookless (the protocol filter is
          // server-side now, so no wrong-protocol fixture here).
          rankedPool({
            poolId: 'pool3',
            feeTier: 10000,
            tickSpacing: 60,
            tvl: 7000,
            hookAddress: '0xEADe493b075Cee00e6A832Af758B7c76793FE880',
          }),
        ]),
      )

      const { result } = renderHook(() =>
        useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies: realCurrencies, hook }),
      )

      expect(result.current.hasExistingFeeTiers).toBe(true)
      expect(result.current.feeTierData['500-60']).toMatchObject({
        id: 'pool1',
        fee: { feeAmount: 500, tickSpacing: 60, isDynamic: false },
        totalLiquidityUsd: 1000,
        tvl: '1000',
        created: true,
      })
      // The filtered-out pools must not create tiers.
      expect(result.current.feeTierData['10000-60']).toBeUndefined()
      expect(Object.values(result.current.feeTierData).filter((tier) => tier.created)).toHaveLength(1)
    })

    it('stays loading (fail closed) when the v2 ListPools query errors, instead of showing every tier as available', () => {
      mockUseInfiniteQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })

      const { result } = renderHook(() =>
        useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies: realCurrencies, hook }),
      )

      expect(result.current.isLoading).toBe(true)

      expect(result.current.isError).toBe(true)
    })
  })

  describe('on-chain existence check candidates (CCA)', () => {
    const realCurrencies = { TOKEN0: DAI, TOKEN1: USDT }
    const emptyOnChainResult = { unavailableFeeTierKeys: new Set<string>(), isLoading: false, isError: false }

    beforeEach(() => {
      mockUseInfiniteQuery.mockReturnValue(listPools([]))
      vi.mocked(useV4PoolsInitializedOnChain).mockReturnValue(emptyOnChainResult)
    })

    afterEach(() => {
      vi.mocked(useV4PoolsInitializedOnChain).mockReturnValue(emptyOnChainResult)
    })

    it('re-keys the default tiers to the launcher-derived spacing: the pool ids the backend will create', () => {
      renderHook(() =>
        useAllFeeTierPoolData({
          chainId,
          protocolVersion: ProtocolVersion.V4,
          sdkCurrencies: realCurrencies,
          hook,
          checkOnChainPoolExistence: true,
        }),
      )
      const call = vi.mocked(useV4PoolsInitializedOnChain).mock.calls.at(-1)?.[0]
      expect(call?.feeTiers.map((tier) => [tier.feeAmount, tier.tickSpacing])).toEqual([
        [100, 1],
        [500, 5],
        [3000, 30],
        [10000, 100],
      ])
    })

    it('passes caller-supplied tiers through unchanged after the re-keyed defaults', () => {
      renderHook(() =>
        useAllFeeTierPoolData({
          chainId,
          protocolVersion: ProtocolVersion.V4,
          sdkCurrencies: realCurrencies,
          hook,
          checkOnChainPoolExistence: true,
          additionalFeeTiersToCheck: [{ feeAmount: 2500, tickSpacing: 25, isDynamic: false }],
        }),
      )
      const call = vi.mocked(useV4PoolsInitializedOnChain).mock.calls.at(-1)?.[0]
      expect(call?.feeTiers.at(-1)).toEqual({ feeAmount: 2500, tickSpacing: 25, isDynamic: false })
    })

    it('marks an on-chain-unavailable new-pool id as created via the candidate fallback', () => {
      vi.mocked(useV4PoolsInitializedOnChain).mockReturnValue({
        unavailableFeeTierKeys: new Set(['3000-30']),
        isLoading: false,
        isError: false,
      })
      const { result } = renderHook(() =>
        useAllFeeTierPoolData({
          chainId,
          protocolVersion: ProtocolVersion.V4,
          sdkCurrencies: realCurrencies,
          hook,
          checkOnChainPoolExistence: true,
        }),
      )
      expect(result.current.feeTierData['3000-30']).toMatchObject({
        created: true,
        fee: { feeAmount: 3000, tickSpacing: 30, isDynamic: false },
      })
      // The v3-table default row stays independent (and uncreated): a deployed pool's spacing is its own.
      expect(result.current.feeTierData['3000-60']?.created).toBe(false)
    })
  })
})
