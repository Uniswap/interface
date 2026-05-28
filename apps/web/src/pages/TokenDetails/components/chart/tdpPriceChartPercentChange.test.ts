import { UTCTimestamp } from 'lightweight-charts'
import { TimePeriod } from '~/appGraphql/data/util'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  getCalculatedPricePercentChange,
  getDisplayedPricePercentChange,
} from '~/pages/TokenDetails/components/chart/tdpPriceChartPercentChange'

function point(time: number, close: number): PriceChartData {
  return {
    time: time as UTCTimestamp,
    value: close,
    open: close,
    high: close,
    low: close,
    close,
  }
}

describe('getCalculatedPricePercentChange', () => {
  it('returns undefined when entries are empty', () => {
    expect(getCalculatedPricePercentChange([])).toBeUndefined()
  })

  it('returns undefined when open close is zero', () => {
    expect(getCalculatedPricePercentChange([point(1, 0), point(2, 1), point(3, 2)])).toBeUndefined()
  })

  it('returns percent change from first to last close', () => {
    const entries = [point(1, 100), point(2, 110), point(3, 150)]
    expect(getCalculatedPricePercentChange(entries)).toBe(50)
  })
})

describe('getDisplayedPricePercentChange', () => {
  it('uses 24h change when time period is DAY', () => {
    const entries = [point(1, 100), point(2, 200), point(3, 400)]
    expect(
      getDisplayedPricePercentChange({
        timePeriod: TimePeriod.DAY,
        priceChange24h: 12.5,
        entries,
      }),
    ).toBe(12.5)
  })

  it('uses calculated change when time period is not DAY', () => {
    const entries = [point(1, 100), point(2, 150), point(3, 400)]
    expect(
      getDisplayedPricePercentChange({
        timePeriod: TimePeriod.WEEK,
        priceChange24h: 99,
        entries,
      }),
    ).toBe(300)
  })
})
