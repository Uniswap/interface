import type { IChartApi, UTCTimestamp } from 'lightweight-charts'

export function findClearingPriceCoordinate(params: {
  chart: IChartApi
  clearingPrice: number
  bars: { tick: number }[]
  priceScaleFactor: number
}): number | null {
  const { chart, clearingPrice, bars, priceScaleFactor } = params
  if (bars.length === 0) {
    return null
  }

  const timeScale = chart.timeScale()

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    const nextBar = bars.at(i + 1)

    if (Math.abs(bar.tick - clearingPrice) < 1e-15) {
      const t = Math.round(bar.tick * priceScaleFactor) as UTCTimestamp
      return timeScale.timeToCoordinate(t)
    }

    if (nextBar && bar.tick <= clearingPrice && clearingPrice <= nextBar.tick) {
      const time1 = Math.round(bar.tick * priceScaleFactor) as UTCTimestamp
      const time2 = Math.round(nextBar.tick * priceScaleFactor) as UTCTimestamp
      const x1 = timeScale.timeToCoordinate(time1)
      const x2 = timeScale.timeToCoordinate(time2)
      if (x1 !== null && x2 !== null) {
        const ratio = (clearingPrice - bar.tick) / (nextBar.tick - bar.tick)
        return x1 + ratio * (x2 - x1)
      }
      return null
    }
  }

  return null
}
