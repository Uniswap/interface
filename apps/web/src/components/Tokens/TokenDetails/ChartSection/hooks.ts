import { GraphQLApi } from '@universe/api'
import { PriceChartData } from 'components/Charts/PriceChart'
import { StackedLineData } from 'components/Charts/StackedLineChart'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import {
  ChartQueryResult,
  checkDataQuality,
  DataQuality,
  withUTCTimestamp,
} from 'components/Tokens/TokenDetails/ChartSection/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo, useReducer } from 'react'

type TDPChartQueryVariables = { chain: GraphQLApi.Chain; address?: string; duration: GraphQLApi.HistoryDuration }

function fallbackToPriceChartData(priceHistoryEntry: GraphQLApi.PriceHistoryFallbackFragment): PriceChartData {
  const { value, timestamp } = priceHistoryEntry
  const time = timestamp as UTCTimestamp
  return { time, value, open: value, high: value, low: value, close: value }
}

function toPriceChartData(ohlc: GraphQLApi.CandlestickOhlcFragment): PriceChartData {
  const { open, high, low, close } = ohlc
  const time = ohlc.timestamp as UTCTimestamp
  return { time, value: close.value, open: open.value, high: high.value, low: low.value, close: close.value }
}

const currentTimeSeconds = () => (Date.now() / 1000) as UTCTimestamp

const CANDLESTICK_FALLBACK_THRESHOLD = 0.1
export function useTDPPriceChartData({
  variables,
  skip,
  priceChartType,
}: {
  variables: TDPChartQueryVariables
  skip: boolean
  priceChartType: PriceChartType
}): ChartQueryResult<PriceChartData, ChartType.PRICE> & { disableCandlestickUI: boolean } {
  const [fallback, enablePriceHistoryFallback] = useReducer(() => true, false)
  const { data, loading } = GraphQLApi.useTokenPriceQuery({ variables: { ...variables, fallback }, skip })

  return useMemo(() => {
    const { ohlc, priceHistory, price } = data?.token?.market ?? {}
    let entries =
      (ohlc
        ? ohlc.filter((v): v is GraphQLApi.CandlestickOhlcFragment => v !== undefined).map(toPriceChartData)
        : priceHistory
            ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
            .map(fallbackToPriceChartData)) ?? []
    const currentPrice = price?.value

    if (ohlc) {
      // Special case: backend returns invalid OHLC data on some chains. If we detect long series of 0's, return an empty array to trigger fallback.
      const zeroCount = entries.filter((x) => x.value === 0).length
      if (!ohlc.length || zeroCount / entries.length > CANDLESTICK_FALLBACK_THRESHOLD) {
        enablePriceHistoryFallback() // triggers a re-fetch that uses priceHistory instead of OHLC
        return {
          chartType: ChartType.PRICE,
          entries: [],
          loading: true,
          disableCandlestickUI: true,
          dataQuality: DataQuality.INVALID,
        }
      }

      // For line charts made using ohlc data, the min and max entries should point to their low/high, rather than close,
      // to ensure the chart line makes contact with the min/max lines.
      if (priceChartType === PriceChartType.LINE) {
        let min = entries[0].low
        let minIndex = 0
        let max = entries[0].high
        let maxIndex = 0

        entries.forEach((entry, index) => {
          if (entry.low < min) {
            min = entry.low
            minIndex = index
          }
          if (entry.high > max) {
            max = entry.high
            maxIndex = index
          }
        })
        // Avoid modifying the last entry, as it should point to the current price
        if (minIndex !== entries.length - 1) {
          entries[minIndex].value = min
        }
        if (maxIndex !== entries.length - 1) {
          entries[maxIndex].value = max
        }
      }
      // Special case: backend data for OHLC data is currently too granular, so points should be combined, halving the data
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      else if (priceChartType === PriceChartType.CANDLESTICK) {
        const combinedEntries = []

        const startIndex = entries.length % 2 // If the length is odd, start at the second entry
        for (let i = startIndex; i < entries.length; i += 2) {
          const first = entries[i]
          const second = entries[i + 1]
          const combined = {
            time: first.time,
            open: first.open,
            high: Math.max(first.high, second.high),
            low: Math.min(first.low, second.low),
            close: second.close,
            value: second.close,
          }
          combinedEntries.push(combined)
        }
        entries = combinedEntries
      }
    }

    // Append current price to end of array to ensure data freshness and that each time period ends with same price
    if (currentPrice && entries.length > 1) {
      const lastEntry = entries[entries.length - 1]
      const secondToLastEntry = entries[entries.length - 2]
      const granularity = lastEntry.time - secondToLastEntry.time

      const time = currentTimeSeconds()
      // If the current price falls within the last entry's time window, update the last entry's close price
      if (time - lastEntry.time < granularity) {
        lastEntry.time = time
        lastEntry.value = currentPrice
        lastEntry.close = currentPrice
      } else {
        // If the current price falls outside the last entry's time window, add it as a new entry
        entries.push({
          time,
          value: currentPrice,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        })
      }
    }

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.PRICE, duration: variables.duration })
    return { chartType: ChartType.PRICE, entries, loading, dataQuality, disableCandlestickUI: fallback }
  }, [data?.token?.market, fallback, loading, priceChartType, variables.duration])
}

export function useTDPVolumeChartData(
  variables: TDPChartQueryVariables,
  skip: boolean,
): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { data, loading } = GraphQLApi.useTokenHistoricalVolumesQuery({ variables, skip })
  return useMemo(() => {
    const entries =
      data?.token?.market?.historicalVolume
        ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
        .map(withUTCTimestamp) ?? []
    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })
    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data?.token?.market?.historicalVolume, loading, variables.duration])
}

function toStackedLineData(entry: { timestamp: number; value: number }): StackedLineData {
  return { values: [entry.value], time: entry.timestamp as UTCTimestamp }
}

export function useTDPTVLChartData(
  variables: TDPChartQueryVariables,
  skip: boolean,
): ChartQueryResult<StackedLineData, ChartType.TVL> {
  const { data, loading } = GraphQLApi.useTokenHistoricalTvlsQuery({ variables, skip })
  return useMemo(() => {
    const { historicalTvl, totalValueLocked } = data?.token?.market ?? {}
    const entries =
      historicalTvl
        ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
        .map(toStackedLineData) ?? []
    const currentTvl = totalValueLocked?.value

    // Append current tvl to end of array to ensure data freshness and that each time period ends with same tvl
    if (currentTvl && entries.length > 1) {
      const lastEntry = entries[entries.length - 1]
      const secondToLastEntry = entries[entries.length - 2]
      const granularity = lastEntry.time - secondToLastEntry.time

      const time = currentTimeSeconds()
      // If the current tvl falls within the last entry's time window, update the last entry's tvl
      if (time - lastEntry.time < granularity) {
        lastEntry.time = time
        lastEntry.values = [currentTvl]
      } else {
        // If the current tvl falls outside the last entry's time window, add it as a new entry
        entries.push({ time, values: [currentTvl] })
      }
    }

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.TVL, duration: variables.duration })
    return { chartType: ChartType.TVL, entries, loading, dataQuality }
  }, [data?.token?.market, loading, variables.duration])
}
