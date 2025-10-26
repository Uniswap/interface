import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Percent } from '@uniswap/sdk-core'
import { useAllFeeTierPoolData } from 'components/Liquidity/hooks/useAllFeeTierPoolData'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from 'test-utils/constants'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('uniswap/src/data/rest/getPools', () => ({
  useGetPoolsByTokens: vi.fn(),
}))

const useGetPoolsByTokensMock = vi.mocked(useGetPoolsByTokens)

const DEFAULT_FEE_TIER_DATA = {
  '100': {
    fee: { feeAmount: 100, tickSpacing: 1, isDynamic: false },
    formattedFee: '0.01%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
  '500': {
    fee: { feeAmount: 500, tickSpacing: 10, isDynamic: false },
    formattedFee: '0.05%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
  '3000': {
    fee: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
    formattedFee: '0.30%',
    totalLiquidityUsd: 0,
    percentage: new Percent(0, 100),
    created: false,
    tvl: '0',
  },
  '10000': {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty feeTierData and hasExistingFeeTiers false if no poolData', () => {
    useGetPoolsByTokensMock.mockReturnValue({ data: undefined } as any)
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
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
        '500': {
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
        '500': {
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
        '500': {
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
        '3000': {
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
        '100-dynamic': {
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
    })
  })

  it('returns hasExistingFeeTiers false if pools array is empty', () => {
    useGetPoolsByTokensMock.mockReturnValue({ data: { pools: [] } } as any)
    const { result } = renderHook(() => useAllFeeTierPoolData({ chainId, protocolVersion, sdkCurrencies, hook }))
    expect(result.current).toEqual({
      feeTierData: DEFAULT_FEE_TIER_DATA,
      hasExistingFeeTiers: false,
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
    })
  })
})
