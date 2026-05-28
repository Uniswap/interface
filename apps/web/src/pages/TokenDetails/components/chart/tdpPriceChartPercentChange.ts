import { TimePeriod } from '~/appGraphql/data/util'
import type { PriceChartData } from '~/components/Charts/PriceChart'

export function getCalculatedPricePercentChange(entries: PriceChartData[]): number | undefined {
  if (!entries.length) {
    return undefined
  }
  const openPrice = entries[0].close
  const closePrice = entries[entries.length - 1].close
  if (!openPrice || !closePrice || openPrice === 0) {
    return undefined
  }
  return ((closePrice - openPrice) / openPrice) * 100
}

export function getDisplayedPricePercentChange({
  timePeriod,
  priceChange24h,
  entries,
}: {
  timePeriod: TimePeriod
  priceChange24h: number | undefined
  entries: PriceChartData[]
}): number | undefined {
  const calculated = getCalculatedPricePercentChange(entries)
  return timePeriod === TimePeriod.DAY ? priceChange24h : calculated
}
