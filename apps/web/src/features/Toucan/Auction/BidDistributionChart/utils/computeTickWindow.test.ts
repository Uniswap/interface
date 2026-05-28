import { CHART_CONSTRAINTS } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import { computeTickWindow } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'

describe('computeTickWindow', () => {
  it('returns original range when data fits naturally', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 100,
      minRequiredMaxIndex: 65,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(100)
  })

  it('extends windowMaxIndex to minRequiredMaxIndex when clearing price is above data', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 10,
      minRequiredMaxIndex: 65,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(65)
  })

  it('includes full range even when very wide', () => {
    const minRequiredMaxIndex = 5_000_000 + CHART_CONSTRAINTS.MIN_TICKS_ABOVE_CLEARING_PRICE
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 100,
      minRequiredMaxIndex,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(minRequiredMaxIndex)
  })

  it('includes full range when bid data spans wide range', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 100_000,
      minRequiredMaxIndex: 50_000 + CHART_CONSTRAINTS.MIN_TICKS_ABOVE_CLEARING_PRICE,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(100_000)
  })

  it('ensures minRequiredMaxIndex is respected', () => {
    const minRequiredMaxIndex = 99_990 + CHART_CONSTRAINTS.MIN_TICKS_ABOVE_CLEARING_PRICE

    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 100_000,
      minRequiredMaxIndex,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(minRequiredMaxIndex)
  })

  it('handles case where clearing price is below all bids', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 100,
      maxTickIndexAvailable: 200,
      minRequiredMaxIndex: 65,
    })

    expect(result.windowMinIndex).toBe(100)
    expect(result.windowMaxIndex).toBe(200)
  })

  it('handles single bid at floor with distant clearing price', () => {
    const minRequiredMaxIndex = 1_000_000 + CHART_CONSTRAINTS.MIN_TICKS_ABOVE_CLEARING_PRICE
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 0,
      minRequiredMaxIndex,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(minRequiredMaxIndex)
  })
})
