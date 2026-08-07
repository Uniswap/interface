import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, Percent } from '@uniswap/sdk-core'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { useGetPoolsByTokens } from 'uniswap/src/data/apiClients/dataApiService/pools/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { usePoolLookupTokenAddresses } from '~/features/Liquidity/hooks/usePoolLookupTokenAddresses'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/getPools', () => ({
  useGetPoolsByTokens: vi.fn(),
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

const useGetPoolsByTokensMock = vi.mocked(useGetPoolsByTokens)

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

  beforeEach(() => {
    vi.mocked(usePoolLookupTokenAddresses).mockImplementation(passThroughLookup)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty feeTierData and hasExistingFeeTiers false if no poolData', () => {
    useGetPoolsByTokensMock.mockReturnValue({ data: undefined } as any)
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
      isLoading: false,
    })
  })

  it('returns correct feeTierData for a single pool', () => {
    useGetPoolsByTokensMock.mockReturnValue({
      data: {
        pools: [
          {
            poolId: 'pool1',
            fee: 500,
            isDynamicFee: false,
            tickSpacing: 60,
            totalLiquidityUsd: '1000.00',
            boostedApr: 0.1,
          },
        ],
      },
    } as any)
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
          tvl: '1000.00',
          created: true,
          boostedApr: 0.1,
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
    })
  })

  it('aggregates pools with the same fee', () => {
    useGetPoolsByTokensMock.mockReturnValue({
      data: {
        pools: [
          {
            poolId: 'pool1',
            fee: 500,
            isDynamicFee: false,
            tickSpacing: 60,
            totalLiquidityUsd: '1000.00',
            boostedApr: 0.1,
          },
          {
            poolId: 'pool2',
            fee: 500,
            isDynamicFee: false,
            tickSpacing: 60,
            totalLiquidityUsd: '2000.00',
            boostedApr: 0.2,
          },
        ],
      },
    } as any)
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
          tvl: '1000.00',
          created: true,
          boostedApr: 0.1,
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
    })
  })

  it('handles multiple pools with different fees', () => {
    useGetPoolsByTokensMock.mockReturnValue({
      data: {
        pools: [
          {
            poolId: 'pool1',
            fee: 500,
            isDynamicFee: false,
            tickSpacing: 60,
            totalLiquidityUsd: '1000.00',
            boostedApr: 0.1,
          },
          {
            poolId: 'pool2',
            fee: 3000,
            isDynamicFee: false,
            tickSpacing: 60,
            totalLiquidityUsd: '2000.00',
            boostedApr: 0.2,
          },
        ],
      },
    } as any)
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
          tvl: '1000.00',
          created: true,
          boostedApr: 0.1,
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
          tvl: '2000.00',
          created: true,
          boostedApr: 0.2,
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
    })
  })

  it('handles dynamic fee tier', () => {
    useGetPoolsByTokensMock.mockReturnValue({
      data: {
        pools: [
          {
            poolId: 'pool-dyn',
            fee: 100,
            isDynamicFee: true,
            tickSpacing: 60,
            totalLiquidityUsd: '5000.00',
            boostedApr: 0.3,
          },
        ],
      },
    } as any)
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
        '100-60-dynamic': {
          id: 'pool-dyn',
          fee: {
            feeAmount: 100,
            isDynamic: true,
            tickSpacing: 60,
          },
          formattedFee: 'Dynamic fee',
          totalLiquidityUsd: 5000,
          percentage: new Percent(5000, 5000),
          tvl: '5000.00',
          created: true,
          boostedApr: 0.3,
        },
      },
      hasExistingFeeTiers: true,
      isLoading: false,
    })
  })

  it('returns hasExistingFeeTiers false if pools array is empty', () => {
    useGetPoolsByTokensMock.mockReturnValue({ data: { pools: [] } } as any)
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
      isLoading: false,
    })
  })

  it('handles missing tokens gracefully', () => {
    useGetPoolsByTokensMock.mockReturnValue({ data: { pools: [] } } as any)
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
    })
  })

  it('should report loading while the permissions address mapping is loading', () => {
    useGetPoolsByTokensMock.mockReturnValue({ data: undefined, isLoading: false } as any)
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
})
