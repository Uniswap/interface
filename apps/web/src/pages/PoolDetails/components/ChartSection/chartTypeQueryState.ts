import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { createParser, useQueryState, parseAsString } from 'nuqs'
import { ChartType } from '~/utils/charts'

export const PDP_CHART_SELECTOR_OPTIONS = [
  ChartType.VOLUME,
  ChartType.PRICE,
  ChartType.LIQUIDITY,
  ChartType.DEPTH,
] as const

/** Under `pdp_revamp` the price chart carries the volume as bars along its bottom, so there's no Volume tab. */
export const PDP_REVAMP_CHART_SELECTOR_OPTIONS = [ChartType.PRICE, ChartType.LIQUIDITY, ChartType.DEPTH] as const

export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const CHART_URL_VALUE_TO_TYPE: Record<string, PoolsDetailsChartType> = {
  volume: ChartType.VOLUME,
  price: ChartType.PRICE,
  liquidity: ChartType.LIQUIDITY,
  depth: ChartType.DEPTH,
}
const CHART_TYPE_TO_URL_VALUE: Record<PoolsDetailsChartType, string> = {
  [ChartType.VOLUME]: 'volume',
  [ChartType.PRICE]: 'price',
  [ChartType.LIQUIDITY]: 'liquidity',
  [ChartType.DEPTH]: 'depth',
}
const parseAsPDPChartType = createParser({
  parse: (query: string) => CHART_URL_VALUE_TO_TYPE[query.toLowerCase()] ?? null,
  serialize: (value: PoolsDetailsChartType) => CHART_TYPE_TO_URL_VALUE[value],
})
  .withDefault(ChartType.VOLUME)
  .withOptions({ clearOnDefault: true })

/**
 * The pool details chart's selected tab, kept in `?chart=` so the panel can switch it as well as the tabs.
 * Under `pdp_revamp`, Volume (the default, and old links) reads as Price, which shows the volume too.
 */
export function usePdpChartTypeQueryState(): [PoolsDetailsChartType, (type: PoolsDetailsChartType) => void] {
  const isPdpRevampEnabled = useFeatureFlag(FeatureFlags.PdpRevamp)
  const [chartType, setChartType] = useQueryState('chart', parseAsPDPChartType)
  return [isPdpRevampEnabled && chartType === ChartType.VOLUME ? ChartType.PRICE : chartType, setChartType]
}

/**
 * The Price tab's candlestick mode, kept in `?candles=` beside the chart type: absent draws the line, and a
 * value is the preferred candle interval's id (see `CANDLE_INTERVALS`), which reads as the period's default
 * interval wherever that period doesn't offer it.
 */
export function usePdpCandleQueryState(): [string | null, (interval: string | null) => void] {
  const [candles, setCandles] = useQueryState('candles', parseAsString)
  return [candles, setCandles]
}
