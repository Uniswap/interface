import { Locale } from 'uniswap/src/features/language/constants'
import { formatPercent } from 'utilities/src/format/localeBased'
import type { PercentNumberDecimals } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'
import {
  CUSTOM_PRICE_HISTOGRAM_NEGATIVE_FULL_EXTENT_PERCENT,
  CUSTOM_PRICE_HISTOGRAM_POSITIVE_FULL_EXTENT_PERCENT,
  getConcentratedPriceHistogramHeights,
  getCustomPriceHistogramLayerTitle,
  getCustomPriceHistogramLayers,
  getHistogramXForPercentFromClearing,
  getLayeredPriceHistogramColor,
  getPriceHistogramBarCountForWidth,
  getPriceHistogramBarOpacity,
} from '~/pages/Liquidity/CreateAuction/components/PriceHistogram'
import { CUSTOM_PRICE_RANGE_POSITIVE_INFINITY } from '~/pages/Liquidity/CreateAuction/types'

function formatPercentEnUs(value: Maybe<number | string>, maxDecimals?: PercentNumberDecimals): string {
  return formatPercent({ rawPercentage: value, locale: Locale.EnglishUnitedStates, maxDecimals })
}

describe('PriceHistogram helpers', () => {
  it('keeps the responsive bar count odd and bounded', () => {
    expect(getPriceHistogramBarCountForWidth(0)).toBe(7)
    expect(getPriceHistogramBarCountForWidth(72)).toBe(13)
    expect(getPriceHistogramBarCountForWidth(640)).toBe(127)
    expect(getPriceHistogramBarCountForWidth(10_000)).toBe(199)
  })

  it('uses the expected edge fade opacities', () => {
    expect([0, 1, 2, 3].map((index) => getPriceHistogramBarOpacity(index, 9))).toEqual([0.12, 0.24, 0.54, 1])
    expect([5, 6, 7, 8].map((index) => getPriceHistogramBarOpacity(index, 9))).toEqual([1, 0.54, 0.24, 0.12])
  })

  it('uses 42px bars left of center and 48px from the center bar onward', () => {
    const heights = getConcentratedPriceHistogramHeights(7)

    expect(heights).toEqual([42, 42, 42, 48, 48, 48, 48])
  })

  it('creates stacked custom layers from entry liquidity percentages', () => {
    const layers = getCustomPriceHistogramLayers({
      barColor: '#02d497',
      neutral1Color: '#000000',
      entries: [
        {
          id: 'custom-range-1',
          liquidityPercent: 25,
          minPercentFromClearing: -100,
          maxPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
        },
        { id: 'custom-range-2', liquidityPercent: 35, minPercentFromClearing: -50, maxPercentFromClearing: 100 },
        { id: 'custom-range-3', liquidityPercent: 40, minPercentFromClearing: -33, maxPercentFromClearing: 50 },
      ],
    })

    expect(layers.map((layer) => layer.entryId)).toEqual(['custom-range-1', 'custom-range-2', 'custom-range-3'])
    expect(layers[0]?.height).toBe(12)
    expect(layers[0]?.y).toBe(45)
    expect(layers[1]?.height).toBeCloseTo(16.8)
    expect(layers[1]?.y).toBeCloseTo(28.2)
    expect(layers[2]?.height).toBeCloseTo(19.2)
    expect(layers[2]?.y).toBe(9)
  })

  it('stacks layers by range width descending so wider ranges sit at the bottom', () => {
    const layers = getCustomPriceHistogramLayers({
      barColor: '#02d497',
      neutral1Color: '#000000',
      entries: [
        { id: 'narrow', liquidityPercent: 30, minPercentFromClearing: -10, maxPercentFromClearing: 10 },
        {
          id: 'widest',
          liquidityPercent: 30,
          minPercentFromClearing: -100,
          maxPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
        },
        { id: 'medium', liquidityPercent: 30, minPercentFromClearing: -50, maxPercentFromClearing: 100 },
      ],
    })

    expect(layers.map((layer) => layer.entryId)).toEqual(['widest', 'medium', 'narrow'])
    // The first (widest) layer sits at the bottom of the stack.
    const ys = layers.map((layer) => layer.y) as [number, number, number]
    expect(ys[0]).toBeGreaterThan(ys[1])
    expect(ys[1]).toBeGreaterThan(ys[2])
  })

  it('maps negative % linearly to −100% at the left edge and positive % to +500% at the right edge', () => {
    const params = { startX: 0, centerX: 50, totalBarsWidth: 100 } as const

    expect(getHistogramXForPercentFromClearing(Number.POSITIVE_INFINITY, params)).toBe(100)

    expect(getHistogramXForPercentFromClearing(0, params)).toBe(50)

    expect(getHistogramXForPercentFromClearing(-100, params)).toBe(0)
    expect(getHistogramXForPercentFromClearing(-50, params)).toBe(25)

    expect(getHistogramXForPercentFromClearing(500, params)).toBe(100)
    expect(getHistogramXForPercentFromClearing(250, params)).toBe(75)

    expect(CUSTOM_PRICE_HISTOGRAM_NEGATIVE_FULL_EXTENT_PERCENT).toBe(100)
    expect(CUSTOM_PRICE_HISTOGRAM_POSITIVE_FULL_EXTENT_PERCENT).toBe(500)
  })

  it('clamps finite bounds past the nominal full extent', () => {
    const params = { startX: 0, centerX: 50, totalBarsWidth: 100 } as const

    expect(getHistogramXForPercentFromClearing(-200, params)).toBe(0)
    expect(getHistogramXForPercentFromClearing(800, params)).toBe(100)
  })

  it('adds 10% neutral1 to each new custom layer color', () => {
    expect(getLayeredPriceHistogramColor({ barColor: '#02d497', neutral1Color: '#000000', layerIndex: 0 })).toBe(
      '#02d497',
    )
    expect(getLayeredPriceHistogramColor({ barColor: '#02d497', neutral1Color: '#000000', layerIndex: 2 })).toBe(
      '#01a978',
    )
  })

  it('formats custom layer title from liquidity percent and min/max bounds', () => {
    expect(
      getCustomPriceHistogramLayerTitle(
        {
          id: 'a',
          liquidityPercent: 35,
          minPercentFromClearing: -50,
          maxPercentFromClearing: 100,
        },
        formatPercentEnUs,
      ),
    ).toBe('35% (-50%, +100%)')

    expect(
      getCustomPriceHistogramLayerTitle(
        {
          id: 'b',
          liquidityPercent: 40,
          minPercentFromClearing: -33,
          maxPercentFromClearing: 50,
        },
        formatPercentEnUs,
      ),
    ).toBe('40% (-33%, +50%)')
  })
})
