import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Token } from '@uniswap/sdk-core'
import { USDC_MAINNET as USDC } from 'uniswap/src/constants/tokens'
import type { LinearTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import { priceToY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'

// Identity scale so a Y position reads directly as a tick.
const tickScale: LinearTickScale = {
  tickToAxis: (tick) => tick,
  axisToTick: (y) => y,
  minTick: -887_220,
  maxTick: 887_220,
  range: [-887_220, 887_220],
}

function displayPrice(tick: number, baseCurrency = TEST_TOKEN_1, quoteCurrency = TEST_TOKEN_2): number {
  return (
    getDisplayPriceFromTick({
      tick,
      baseCurrency,
      quoteCurrency,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    }) ?? 0
  )
}

function entry(tick: number, baseCurrency = TEST_TOKEN_1, quoteCurrency = TEST_TOKEN_2): ChartEntry {
  return { tick, price0: displayPrice(tick, baseCurrency, quoteCurrency), liquidityActive: 1 }
}

const WLD = new Token(1, '0x163f8C2467924be0ae7B5347228CABF260318753', 18, 'WLD')

describe('priceToY', () => {
  it('snaps to the closest liquidity entry when it is within a tick spacing', () => {
    const liquidityData = [entry(-120), entry(0), entry(120)]
    // Tick 50 sits closer to 0 than to 120, so the price line lands on the tick-0 entry.
    expect(
      priceToY({
        price: displayPrice(50),
        liquidityData,
        tickScale,
        tickSpacing: 60,
        baseCurrency: TEST_TOKEN_1,
        quoteCurrency: TEST_TOKEN_2,
      }),
    ).toBe(0)
  })

  it('places the price on its own tick when the closest entry is more than a tick spacing away', () => {
    const liquidityData = [entry(-6000), entry(0), entry(6000)]
    expect(
      priceToY({
        price: displayPrice(2_500),
        liquidityData,
        tickScale,
        tickSpacing: 60,
        baseCurrency: TEST_TOKEN_1,
        quoteCurrency: TEST_TOKEN_2,
      }),
    ).toBeCloseTo(2_500, 2)
  })

  it('follows the price history in a pool whose only ticks are an emptied full-range position', () => {
    // WLD/USDC v4 at tickSpacing 1 with no active liquidity: the distribution is the two full-range
    // ticks plus the active tick, and every historical price is closest to the active tick's entry.
    const activeTick = -286_130
    const liquidityData = [entry(-887_272, WLD, USDC), entry(activeTick, WLD, USDC), entry(887_272, WLD, USDC)]
    const ys = [0.369, 0.38, 0.4147, 0.37514].map((price) =>
      priceToY({ price, liquidityData, tickScale, tickSpacing: 1, baseCurrency: WLD, quoteCurrency: USDC }),
    )
    // Independent literals: ticks of 0.369, 0.38 and 0.4147 USDC per WLD.
    expect(ys[0]).toBeCloseTo(-286_294.1, 0)
    expect(ys[1]).toBeCloseTo(-286_000.4, 0)
    expect(ys[2]).toBeCloseTo(-285_126.5, 0)
    // The current price is within a tick of the active tick, so it still lands on that entry.
    expect(ys[3]).toBe(activeTick)
  })

  it('places the price on its own tick when there is no liquidity data', () => {
    const price = getDisplayPriceFromTick({
      tick: 1_234,
      baseCurrency: TEST_TOKEN_1,
      quoteCurrency: TEST_TOKEN_2,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    })
    expect(
      priceToY({
        price: price ?? 0,
        liquidityData: [],
        tickScale,
        tickSpacing: 60,
        baseCurrency: TEST_TOKEN_1,
        quoteCurrency: TEST_TOKEN_2,
      }),
    ).toBeCloseTo(1_234, 2)
  })
})
