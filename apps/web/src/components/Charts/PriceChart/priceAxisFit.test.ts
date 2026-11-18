import type { AutoscaleInfo, ISeriesApi, SeriesType } from 'lightweight-charts'
import { PriceAxisFit, widenAutoscaleToRange } from '~/components/Charts/PriceChart/priceAxisFit'

const SERIES_RANGE: AutoscaleInfo = { priceRange: { minValue: 90, maxValue: 110 } }

describe('widenAutoscaleToRange', () => {
  it('takes in edges near the series', () => {
    expect(widenAutoscaleToRange(SERIES_RANGE, { lower: 80, upper: 130 })?.priceRange).toEqual({
      minValue: 80,
      maxValue: 130,
    })
  })

  it('leaves an edge far past the series to run off the chart, like an open one', () => {
    // One step in from ∞ is around 1e38: fitting to it would flatten the series against the pane.
    expect(widenAutoscaleToRange(SERIES_RANGE, { lower: 80, upper: 1e38 })?.priceRange).toEqual({
      minValue: 80,
      maxValue: 110,
    })
  })

  it('gives a flat series a share of its price to reach across', () => {
    const flat: AutoscaleInfo = { priceRange: { minValue: 1, maxValue: 1 } }
    expect(widenAutoscaleToRange(flat, { lower: 0.995, upper: 1.005 })?.priceRange).toEqual({
      minValue: 0.995,
      maxValue: 1.005,
    })
  })
})

describe('PriceAxisFit', () => {
  function mockSeries() {
    const applyOptions = vi.fn()
    return { series: { applyOptions } as unknown as ISeriesApi<SeriesType>, applyOptions }
  }

  it('leaves the series alone when there was never a band', () => {
    const { series, applyOptions } = mockSeries()
    const fit = new PriceAxisFit()

    fit.update(series, { scale: 1 })
    fit.update(series, { scale: 1 })

    expect(applyOptions).not.toHaveBeenCalled()
  })

  it('clears the provider once when the band goes', () => {
    const { series, applyOptions } = mockSeries()
    const fit = new PriceAxisFit()

    fit.update(series, { band: { lower: 95, upper: 105 }, scale: 1 })
    fit.update(series, { scale: 1 })
    fit.update(series, { scale: 1 })

    expect(applyOptions).toHaveBeenCalledTimes(2)
    expect(applyOptions).toHaveBeenLastCalledWith({ autoscaleInfoProvider: undefined })
  })

  it('leaves the axis to the visible prices while time is zoomed', () => {
    const { series, applyOptions } = mockSeries()
    let isTimeZoomed = false
    const fit = new PriceAxisFit(() => isTimeZoomed)

    fit.update(series, { band: { lower: 50, upper: 150 }, scale: 1 })
    const provider = applyOptions.mock.calls[0][0].autoscaleInfoProvider as (
      original: () => AutoscaleInfo | null,
    ) => AutoscaleInfo | null

    expect(provider(() => SERIES_RANGE)?.priceRange).toEqual({ minValue: 50, maxValue: 150 })
    isTimeZoomed = true
    expect(provider(() => SERIES_RANGE)).toEqual(SERIES_RANGE)
  })
})
