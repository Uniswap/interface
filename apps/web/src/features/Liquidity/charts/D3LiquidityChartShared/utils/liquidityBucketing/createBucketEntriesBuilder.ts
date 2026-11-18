import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { CHART_BEHAVIOR } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import {
  type BucketChartEntry,
  buildBucketChartEntries,
  buildBuckets,
  buildFullGranularityBuckets,
  buildSegmentsFromRawTicks,
  createDisplayPriceAtTick,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import type { TickData } from '~/features/Liquidity/types/ticks'

type PriceParams = {
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}

function isSamePriceParams(a: PriceParams, b: PriceParams): boolean {
  return (
    a.baseCurrency === b.baseCurrency &&
    a.quoteCurrency === b.quoteCurrency &&
    a.priceInverted === b.priceInverted &&
    a.protocolVersion === b.protocolVersion
  )
}

/**
 * The bars a liquidity chart draws for a view: `DESIRED_BUCKETS` grouped buckets, or with `groupTicks` off one
 * per tick spacing (see buildFullGranularityBuckets), on a fixed grid either way. Segments are built once per
 * data, and a redraw over the same view (a hover, a handle drag) gets the previous bars back as they were.
 * Returns undefined when the ticks carry no liquidity to draw.
 */
export function createBucketEntriesBuilder({
  rawTicks,
  liquidityData,
  tickSpacing,
  groupTicks,
  groupedAmountScope = 'segment',
}: {
  rawTicks: TickData[]
  liquidityData: ChartEntry[]
  tickSpacing: number
  groupTicks: boolean
  /** What a grouped bar's amounts cover (see buildBucketChartEntries); a full-granularity bar's are its segment's. */
  groupedAmountScope?: 'segment' | 'bucket'
}): (
  params: PriceParams & {
    visibleMinTick: number
    visibleMaxTick: number
    /** Ticks per pixel along the chart's tick axis, from the zoom alone; sets the full-granularity bar size. */
    ticksPerPixel: number
  },
) => BucketChartEntry[] | undefined {
  const segments = buildSegmentsFromRawTicks(rawTicks)
  let priceMemo: { params: PriceParams; getPrice0: (tick: number) => number | undefined } | undefined
  let entriesMemo: { key: string; params: PriceParams; entries: BucketChartEntry[] } | undefined

  return ({ visibleMinTick, visibleMaxTick, ticksPerPixel, ...priceParams }) => {
    if (segments.length === 0) {
      return undefined
    }
    const buckets = groupTicks
      ? buildBuckets({
          segments,
          visibleMinTick,
          visibleMaxTick,
          desiredBars: CHART_BEHAVIOR.DESIRED_BUCKETS,
          tickSpacing,
          fixedGrid: true,
        })
      : buildFullGranularityBuckets({ segments, visibleMinTick, visibleMaxTick, tickSpacing, ticksPerPixel })

    // The grid is fixed, so the same first and last bars at the same count are the same bars.
    const first = buckets.at(0)
    const last = buckets.at(-1)
    const key = `${buckets.length}:${first?.startTick}:${first?.endTick}:${last?.startTick}:${last?.endTick}`
    if (entriesMemo && entriesMemo.key === key && isSamePriceParams(entriesMemo.params, priceParams)) {
      return entriesMemo.entries
    }

    let getPrice0: ((tick: number) => number | undefined) | undefined
    if (!groupTicks) {
      if (!priceMemo || !isSamePriceParams(priceMemo.params, priceParams)) {
        priceMemo = { params: priceParams, getPrice0: createDisplayPriceAtTick(priceParams) }
      }
      getPrice0 = priceMemo.getPrice0
    }
    const entries = buildBucketChartEntries({
      buckets,
      liquidityData,
      ...priceParams,
      getPrice0,
      amountScope: groupTicks ? groupedAmountScope : 'segment',
    })
    entriesMemo = { key, params: priceParams, entries }
    return entries
  }
}
