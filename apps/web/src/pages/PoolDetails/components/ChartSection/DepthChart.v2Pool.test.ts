import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { MIN_DEPTH_BARS_PER_SIDE } from '~/pages/PoolDetails/components/ChartSection/DepthChart'
import { buildDepthData } from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'
import { renderHook, waitFor } from '~/test-utils/render'
import { PositionField } from '~/types/position'

// v2 bars come from reserves alone; stub the liquidity-service reads the hook would otherwise make.
// Inputs stay referentially stable across renders, as they are in the app, so the hook's effects settle.
const { emptyPool, emptyTicks } = vi.hoisted(() => ({
  emptyPool: { data: undefined, isLoading: false },
  emptyTicks: { isLoading: false, error: undefined, ticks: undefined },
}))

vi.mock('~/features/Liquidity/hooks/useLiquidityServiceGetPool', () => ({
  useLiquidityServiceGetPool: () => emptyPool,
}))

vi.mock('~/features/Liquidity/hooks/useLiquidityServicePoolTicks', () => ({
  useLiquidityServicePoolTicks: () => emptyTicks,
}))

const SDK_CURRENCIES = { [PositionField.TOKEN0]: TEST_TOKEN_1, [PositionField.TOKEN1]: TEST_TOKEN_2 }
const V2_RESERVES = { reserve0: 1000, reserve1: 2000 }

describe('buildDepthData with v2 synthetic bars', () => {
  it('has enough bars either side of the active tick for the depth chart to render', async () => {
    const { result } = renderHook(() =>
      useLiquidityBarData({
        sdkCurrencies: SDK_CURRENCIES,
        feeTier: V2_DEFAULT_FEE_TIER,
        isReversed: false,
        chainId: UniverseChainId.Mainnet,
        version: ProtocolVersion.V2,
        poolId: '0x0000000000000000000000000000000000000003',
        v2Reserves: V2_RESERVES,
      }),
    )

    await waitFor(() => expect(result.current.tickData?.barData.length).toBeGreaterThan(0))

    const { sellData, buyData } = buildDepthData({
      barData: result.current.tickData!.barData,
      activeTick: result.current.activeTick!,
      feeTier: V2_DEFAULT_FEE_TIER,
      token0Decimals: TEST_TOKEN_1.decimals,
      token1Decimals: TEST_TOKEN_2.decimals,
      isReversed: false,
    })
    expect(sellData.length - 1).toBeGreaterThanOrEqual(MIN_DEPTH_BARS_PER_SIDE)
    expect(buyData.length - 1).toBeGreaterThanOrEqual(MIN_DEPTH_BARS_PER_SIDE)
    // Cumulative depth ramps monotonically away from the mid price.
    const depths = buyData.map((p) => p.value)
    expect(depths).toEqual(depths.slice().sort((a, b) => a - b))
  })
})
