import { useMemo } from 'react'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  buildCandles,
  type CandleInterval,
  getCandleIntervalOptions,
  getDefaultCandleInterval,
} from '~/pages/PoolDetails/components/ChartSection/candles'
import { usePdpCandleQueryState } from '~/pages/PoolDetails/components/ChartSection/chartTypeQueryState'
import { PriceChartType } from '~/utils/charts'

// Stored on switching to candles: each period's default interval, until one is picked.
const AUTO_INTERVAL = 'auto'

/**
 * The Price tab's line/candles choice and candle interval (kept in the URL), and the candles built from the
 * price history at that interval while `enabled`.
 */
export function usePdpCandles({ priceEntries, enabled }: { priceEntries?: PriceChartData[]; enabled: boolean }): {
  priceChartType: PriceChartType
  setPriceChartType: (type: PriceChartType) => void
  intervalOptions: CandleInterval[]
  interval?: CandleInterval
  setInterval: (id: string) => void
  candles?: PriceChartData[]
} {
  const [preference, setPreference] = usePdpCandleQueryState()
  const intervalOptions = useMemo(() => getCandleIntervalOptions(priceEntries ?? []), [priceEntries])
  const interval =
    preference === null
      ? undefined
      : (intervalOptions.find(({ id }) => id === preference) ??
        getDefaultCandleInterval(intervalOptions, priceEntries ?? []))
  const candles = useMemo(
    () => (enabled && interval && priceEntries ? buildCandles(priceEntries, interval) : undefined),
    [enabled, interval, priceEntries],
  )

  return {
    // From what's drawn, not the URL alone: a series too short for any interval stays a line.
    priceChartType: candles ? PriceChartType.CANDLESTICK : PriceChartType.LINE,
    setPriceChartType: (type) => setPreference(type === PriceChartType.CANDLESTICK ? AUTO_INTERVAL : null),
    intervalOptions,
    interval,
    setInterval: setPreference,
    candles,
  }
}
