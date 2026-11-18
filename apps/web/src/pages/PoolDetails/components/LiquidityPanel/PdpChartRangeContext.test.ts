import { describe, expect, it } from 'vitest'
import { getUsableTickBounds } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { priceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import {
  chartBandToDisplayTicks,
  chartPriceRangeToDisplayTicks,
  displayTicksToChartPriceRange,
  FULL_CHART_PRICE_RANGE,
  invertChartPriceRange,
  poolTicksToChartPriceRange,
} from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'

/** Both edges of a tick range as token0-in-token1 prices, as the chart range reads them. */
function tickRangePrices({
  tickLower,
  tickUpper,
  decimals0,
  decimals1,
}: {
  tickLower: number
  tickUpper: number
  decimals0: number
  decimals1: number
}): { lower: number; upper: number } {
  const toPrice = (tick: number) => priceFromTick({ tick, token0Decimals: decimals0, token1Decimals: decimals1 })
  return { lower: toPrice(tickLower), upper: toPrice(tickUpper) }
}

describe('invertChartPriceRange', () => {
  it('reciprocates and swaps the edges', () => {
    expect(invertChartPriceRange({ lower: 2, upper: 4 })).toEqual({ lower: 0.25, upper: 0.5 })
  })

  it('keeps an open edge open on the other side', () => {
    expect(invertChartPriceRange({ lower: 2, upper: undefined })).toEqual({ lower: undefined, upper: 0.5 })
  })
})

describe('chartPriceRangeToDisplayTicks', () => {
  const pool = { decimals0: 18, decimals1: 6, tickSpacing: 60 }

  it('round-trips a range of tick prices back to its ticks', () => {
    const range = tickRangePrices({ tickLower: -198_600, tickUpper: -197_400, decimals0: 18, decimals1: 6 })
    expect(chartPriceRangeToDisplayTicks({ range, ...pool, priceInverted: false })).toEqual({
      minTick: -198_600,
      maxTick: -197_400,
    })
  })

  it('snaps a dragged price to the nearest usable tick', () => {
    const { lower } = tickRangePrices({ tickLower: -198_610, tickUpper: 0, decimals0: 18, decimals1: 6 })
    const upper = tickRangePrices({ tickLower: -197_400, tickUpper: 0, decimals0: 18, decimals1: 6 }).lower
    expect(chartPriceRangeToDisplayTicks({ range: { lower, upper }, ...pool, priceInverted: false }).minTick).toBe(
      -198_600,
    )
  })

  it('negates and swaps the ticks when the flow shows the price inverted', () => {
    const range = tickRangePrices({ tickLower: -198_600, tickUpper: -197_400, decimals0: 18, decimals1: 6 })
    expect(chartPriceRangeToDisplayTicks({ range, ...pool, priceInverted: true })).toEqual({
      minTick: 197_400,
      maxTick: 198_600,
    })
  })

  it('puts an open edge at the usable bound', () => {
    const { lower } = tickRangePrices({ tickLower: -198_600, tickUpper: 0, decimals0: 18, decimals1: 6 })
    expect(chartPriceRangeToDisplayTicks({ range: { lower }, ...pool, priceInverted: false })).toEqual({
      minTick: -198_600,
      maxTick: getUsableTickBounds(60).maxTick,
    })
  })

  it('keeps the range at least one spacing wide', () => {
    const { lower } = tickRangePrices({ tickLower: -198_600, tickUpper: 0, decimals0: 18, decimals1: 6 })
    expect(chartPriceRangeToDisplayTicks({ range: { lower, upper: lower }, ...pool, priceInverted: false })).toEqual({
      minTick: -198_600,
      maxTick: -198_540,
    })
  })
})

describe('poolTicksToChartPriceRange', () => {
  const pool = { decimals0: 18, decimals1: 6, tickSpacing: 60 }
  const bounds = getUsableTickBounds(60)

  it('prices both edges of a bounded range as token0 in token1', () => {
    // WETH (18) / USDC (6) at tick -198_000 is roughly 2,500 USDC per WETH
    const { lower, upper } = poolTicksToChartPriceRange({ tickLower: -198_600, tickUpper: -197_400, ...pool })
    expect(lower).toBeGreaterThan(2_300)
    expect(upper).toBeLessThan(2_700)
    expect(lower).toBeLessThan(upper ?? 0)
  })

  it('leaves an edge at the usable bound open', () => {
    expect(
      poolTicksToChartPriceRange({ tickLower: bounds.minTick, tickUpper: -197_400, ...pool }).lower,
    ).toBeUndefined()
    expect(
      poolTicksToChartPriceRange({ tickLower: -198_600, tickUpper: bounds.maxTick, ...pool }).upper,
    ).toBeUndefined()
  })
})

describe('displayTicksToChartPriceRange', () => {
  const pool = { decimals0: 18, decimals1: 6, tickSpacing: 60 }
  const prices = tickRangePrices({ tickLower: -198_600, tickUpper: -197_400, decimals0: 18, decimals1: 6 })

  it('prices display ticks as-is when the price is not inverted', () => {
    expect(
      displayTicksToChartPriceRange({
        range: { minTick: -198_600, maxTick: -197_400 },
        ...pool,
        priceInverted: false,
      }),
    ).toEqual(prices)
  })

  it('negates and swaps inverted display ticks back to the pool ticks first', () => {
    expect(
      displayTicksToChartPriceRange({ range: { minTick: 197_400, maxTick: 198_600 }, ...pool, priceInverted: true }),
    ).toEqual(prices)
  })

  it('keeps an inverted open edge open on the matching side', () => {
    const { maxTick } = getUsableTickBounds(60)
    // The display max edge is the pool's lower edge when inverted.
    expect(
      displayTicksToChartPriceRange({ range: { minTick: 197_400, maxTick }, ...pool, priceInverted: true }),
    ).toEqual({ lower: undefined, upper: prices.upper })
  })

  it.each([false, true])('round-trips through chartPriceRangeToDisplayTicks (priceInverted=%s)', (priceInverted) => {
    const range = priceInverted ? { minTick: 197_400, maxTick: 198_600 } : { minTick: -198_600, maxTick: -197_400 }
    const chartRange = displayTicksToChartPriceRange({ range, ...pool, priceInverted })
    expect(chartPriceRangeToDisplayTicks({ range: chartRange, ...pool, priceInverted })).toEqual(range)
  })
})

describe('chartBandToDisplayTicks', () => {
  const pool = { decimals0: 18, decimals1: 6, tickSpacing: 60, priceInverted: false }
  const range = tickRangePrices({ tickLower: -198_600, tickUpper: -197_400, decimals0: 18, decimals1: 6 })

  it('reads a band on a chart in the series orientation as the range itself', () => {
    expect(chartBandToDisplayTicks({ band: range, isReversed: false, ...pool })).toEqual({
      minTick: -198_600,
      maxTick: -197_400,
    })
  })

  it('reads a band dragged on a reversed chart back to the same ticks', () => {
    const band = invertChartPriceRange(range)
    expect(chartBandToDisplayTicks({ band, isReversed: true, ...pool })).toEqual({
      minTick: -198_600,
      maxTick: -197_400,
    })
  })

  it('leaves an open edge of a reversed band at the usable bound', () => {
    const bounds = getUsableTickBounds(60)
    const band = invertChartPriceRange({ lower: range.lower, upper: undefined })
    expect(chartBandToDisplayTicks({ band, isReversed: true, ...pool })).toEqual({
      minTick: -198_600,
      maxTick: bounds.maxTick,
    })
  })
})
