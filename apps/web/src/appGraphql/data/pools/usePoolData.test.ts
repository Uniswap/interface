import { usePoolData } from 'appGraphql/data/pools/usePoolData'
import { FeeAmount } from '@uniswap/v3-sdk'
import { GraphQLApi } from '@universe/api'
import { validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { renderHook } from 'test-utils/render'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { GQL_MAINNET_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const { mockV4Query, mockV3Query, mockV2Query, mockUseEnabledChains } = vi.hoisted(() => {
  const mockV4Query = vi.fn()
  const mockV3Query = vi.fn()
  const mockV2Query = vi.fn()
  const mockUseEnabledChains = vi.fn()
  return { mockV4Query, mockV3Query, mockV2Query, mockUseEnabledChains }
})

vi.mock('@universe/api', async () => {
  const actual = await vi.importActual('@universe/api')
  return {
    ...actual,
    GraphQLApi: {
      ...(actual.GraphQLApi || {}),
      useV4PoolQuery: mockV4Query,
      useV3PoolQuery: mockV3Query,
      useV2PairQuery: mockV2Query,
    },
  }
})

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async () => {
  const actual = await vi.importActual('uniswap/src/features/chains/hooks/useEnabledChains')
  return {
    ...actual,
    useEnabledChains: mockUseEnabledChains,
  }
})

const mockV4PoolData = {
  v4Pool: {
    poolId: '0xv4pool123',
    protocolVersion: GraphQLApi.ProtocolVersion.V4,
    feeTier: 500,
    isDynamicFee: false,
    tickSpacing: 55,
    hook: {
      id: '0xhook123',
      address: '0xhook123',
    },
    rewardsCampaign: {
      id: 'campaign1',
      boostedApr: 5.5,
      startTimestamp: 1234567890,
      endTimestamp: 1234567990,
    },
    token0: validBEPoolToken0,
    token0Supply: 100000,
    token1: validBEPoolToken1,
    token1Supply: 50000,
    txCount: 1000,
    volume24h: {
      value: 500000,
    },
    historicalVolume: [
      { value: 100000, timestamp: Date.now() / 1000 - 3600 },
      { value: 200000, timestamp: Date.now() / 1000 - 7200 },
    ],
    totalLiquidity: {
      value: 1000000,
    },
    totalLiquidityPercentChange24h: {
      value: 2.5,
    },
  },
}

const mockV3PoolData = {
  v3Pool: {
    id: '0xv3pool456',
    protocolVersion: GraphQLApi.ProtocolVersion.V3,
    address: '0xv3pool456',
    feeTier: FeeAmount.MEDIUM,
    token0: validBEPoolToken0,
    token0Supply: 80000,
    token1: validBEPoolToken1,
    token1Supply: 40000,
    txCount: 800,
    volume24h: {
      value: 400000,
    },
    historicalVolume: [
      { value: 80000, timestamp: Date.now() / 1000 - 3600 },
      { value: 160000, timestamp: Date.now() / 1000 - 7200 },
    ],
    totalLiquidity: {
      value: 800000,
    },
    totalLiquidityPercentChange24h: {
      value: 1.8,
    },
  },
}

const mockV2PairData = {
  v2Pair: {
    id: '0xv2pair789',
    protocolVersion: GraphQLApi.ProtocolVersion.V2,
    address: '0xv2pair789',
    token0: validBEPoolToken0,
    token0Supply: 60000,
    token1: validBEPoolToken1,
    token1Supply: 30000,
    txCount: 600,
    volume24h: {
      value: 300000,
    },
    historicalVolume: [
      { value: 60000, timestamp: Date.now() / 1000 - 3600 },
      { value: 120000, timestamp: Date.now() / 1000 - 7200 },
    ],
    totalLiquidity: {
      value: 600000,
    },
    totalLiquidityPercentChange24h: {
      value: 1.2,
    },
  },
}

describe('usePoolData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseEnabledChains.mockReturnValue({
      isTestnetModeEnabled: false,
      defaultChainId: UniverseChainId.Mainnet,
      chains: [UniverseChainId.Mainnet],
      gqlChains: GQL_MAINNET_CHAINS,
    })

    mockV4Query.mockReturnValue({ loading: false, error: undefined, data: undefined })
    mockV3Query.mockReturnValue({ loading: false, error: undefined, data: undefined })
    mockV2Query.mockReturnValue({ loading: false, error: undefined, data: undefined })
  })

  it('should return v4 pool data with hook address and rewards campaign', () => {
    mockV4Query.mockReturnValue({
      loading: false,
      error: undefined,
      data: mockV4PoolData,
    })

    const { result } = renderHook(() =>
      usePoolData({
        poolIdOrAddress: '0xv4pool123',
        chainId: UniverseChainId.Mainnet,
        isPoolAddress: false,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.data).toBeDefined()

    expect(result.current.data?.idOrAddress).toBe('0xv4pool123')
    expect(result.current.data?.protocolVersion).toBe(GraphQLApi.ProtocolVersion.V4)
    expect(result.current.data?.feeTier?.feeAmount).toBe(500)
    expect(result.current.data?.feeTier?.tickSpacing).toBe(55)
    expect(result.current.data?.feeTier?.isDynamic).toBe(false)
    expect(result.current.data?.hookAddress).toBe('0xhook123')
    expect(result.current.data?.rewardsCampaign).toEqual({
      id: 'campaign1',
      boostedApr: 5.5,
      startTimestamp: 1234567890,
      endTimestamp: 1234567990,
    })

    expect(result.current.data?.token0).toEqual(validBEPoolToken0)
    expect(result.current.data?.token1).toEqual(validBEPoolToken1)
    expect(result.current.data?.tvlToken0).toBe(100000)
    expect(result.current.data?.tvlToken1).toBe(50000)

    expect(result.current.data?.volumeUSD24H).toBe(500000)
    expect(result.current.data?.tvlUSD).toBe(1000000)
    expect(result.current.data?.tvlUSDChange).toBe(2.5)
    expect(result.current.data?.txCount).toBe(1000)
  })

  it('should return v3 pool data with calculated fee tier', () => {
    mockV3Query.mockReturnValue({
      loading: false,
      error: undefined,
      data: mockV3PoolData,
    })

    const { result } = renderHook(() =>
      usePoolData({
        poolIdOrAddress: '0xv3pool456',
        chainId: UniverseChainId.Mainnet,
        isPoolAddress: true,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.data).toBeDefined()

    expect(result.current.data?.idOrAddress).toBe('0xv3pool456')
    expect(result.current.data?.protocolVersion).toBe(GraphQLApi.ProtocolVersion.V3)
    expect(result.current.data?.feeTier?.feeAmount).toBe(FeeAmount.MEDIUM)
    expect(result.current.data?.feeTier?.tickSpacing).toBe(60)
    expect(result.current.data?.feeTier?.isDynamic).toBe(false)

    expect(result.current.data?.hookAddress).toBeUndefined()
    expect(result.current.data?.rewardsCampaign).toBeUndefined()

    expect(result.current.data?.token0).toEqual(validBEPoolToken0)
    expect(result.current.data?.token1).toEqual(validBEPoolToken1)
    expect(result.current.data?.tvlToken0).toBe(80000)
    expect(result.current.data?.tvlToken1).toBe(40000)

    expect(result.current.data?.volumeUSD24H).toBe(400000)
    expect(result.current.data?.tvlUSD).toBe(800000)
    expect(result.current.data?.tvlUSDChange).toBe(1.8)
    expect(result.current.data?.txCount).toBe(800)
  })

  it('should return v2 pool data with default fee tier', () => {
    mockV2Query.mockReturnValue({
      loading: false,
      error: undefined,
      data: mockV2PairData,
    })

    const { result } = renderHook(() =>
      usePoolData({
        poolIdOrAddress: '0xv2pair789',
        chainId: UniverseChainId.Mainnet,
        isPoolAddress: true,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.data).toBeDefined()

    expect(result.current.data?.idOrAddress).toBe('0xv2pair789')
    expect(result.current.data?.protocolVersion).toBe(GraphQLApi.ProtocolVersion.V2)
    expect(result.current.data?.feeTier?.feeAmount).toBe(V2_DEFAULT_FEE_TIER)
    expect(result.current.data?.feeTier?.tickSpacing).toBeUndefined()
    expect(result.current.data?.feeTier?.isDynamic).toBe(false)

    expect(result.current.data?.hookAddress).toBeUndefined()
    expect(result.current.data?.rewardsCampaign).toBeUndefined()

    expect(result.current.data?.token0).toEqual(validBEPoolToken0)
    expect(result.current.data?.token1).toEqual(validBEPoolToken1)
    expect(result.current.data?.tvlToken0).toBe(60000)
    expect(result.current.data?.tvlToken1).toBe(30000)

    expect(result.current.data?.volumeUSD24H).toBe(300000)
    expect(result.current.data?.tvlUSD).toBe(600000)
    expect(result.current.data?.tvlUSDChange).toBe(1.2)
    expect(result.current.data?.txCount).toBe(600)
  })
})
