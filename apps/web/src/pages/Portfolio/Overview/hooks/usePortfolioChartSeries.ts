import type { PlainMessage } from '@bufbuild/protobuf'
import { ChartPeriod, ChartPoint, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { PriceChartData } from '~/components/Charts/PriceChart'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

export enum PortfolioChartCategory {
  Total = 'total',
  Tokens = 'tokens',
  Earn = 'earn',
  Pools = 'pools',
}

/** Non-total categories in their fixed display order (tokens → earn → pools). */
export const PORTFOLIO_BREAKDOWN_CATEGORIES = [
  PortfolioChartCategory.Tokens,
  PortfolioChartCategory.Earn,
  PortfolioChartCategory.Pools,
] as const

/** A category is shown across the breakdown UI only when its series has a non-zero value. */
export function seriesHasValue(series: PriceChartData[]): boolean {
  return series.some((point) => point.close !== 0)
}

interface UsePortfolioChartSeriesInput {
  chartData: PlainMessage<GetPortfolioChartResponse> | undefined
  selectedPeriod: ChartPeriod
  selectedCategory: PortfolioChartCategory
}

interface UsePortfolioChartSeriesResult {
  series: PriceChartData[]
  /** Per-category series (shared timestamps), used to read each category's value at the scrubbed point. */
  tokensSeries: PriceChartData[]
  poolsSeries: PriceChartData[]
  earnSeries: PriceChartData[]
  chartPercentChange: ChartPercentChange
  /** Period percent change per category (first-to-last of the series), for the breakdown rows at rest. */
  tokensPercentChange: number | undefined
  poolsPercentChange: number | undefined
  earnPercentChange: number | undefined
  /** Non-total categories that have a non-zero value, in fixed display order — what the selector lists. */
  availableCategories: PortfolioChartCategory[]
  /** True when at least two categories have data, so the breakdown split is meaningful. */
  hasCategoryBreakdown: boolean
}

/** Period percent change over a series (first-to-last), or `undefined` for the all-time period. */
function seriesPercentChange(series: PriceChartData[], selectedPeriod: ChartPeriod): ChartPercentChange {
  if (selectedPeriod === ChartPeriod.MAX) {
    return undefined
  }
  return getPortfolioChartPercentChange(series.map((d) => d.close))
}

function convertPortfolioChartDataToPriceChartData(points: readonly PlainMessage<ChartPoint>[]): PriceChartData[] {
  return points.map((point) => {
    // UTCTimestamp expects seconds, and the API returns timestamps as bigint in seconds
    const time = Number(point.timestamp) as UTCTimestamp
    const value = point.value

    // For portfolio balance charts, we use line charts, so all OHLC values are the same
    return {
      time,
      value,
      open: value,
      high: value,
      low: value,
      close: value,
    }
  })
}

/**
 * Builds the total/tokens/pools series from the chart response and returns the one matching the
 * selected category, so the balance header and chart share a single source of truth.
 */
export function usePortfolioChartSeries({
  chartData,
  selectedPeriod,
  selectedCategory,
}: UsePortfolioChartSeriesInput): UsePortfolioChartSeriesResult {
  const totalSeries = useMemo<PriceChartData[]>(
    () => (chartData?.points ? convertPortfolioChartDataToPriceChartData(chartData.points) : []),
    [chartData],
  )

  const tokensSeries = useMemo<PriceChartData[]>(
    () => (chartData?.tokens ? convertPortfolioChartDataToPriceChartData(chartData.tokens) : []),
    [chartData],
  )

  const poolsSeries = useMemo<PriceChartData[]>(
    () => (chartData?.pools ? convertPortfolioChartDataToPriceChartData(chartData.pools) : []),
    [chartData],
  )

  const earnSeries = useMemo<PriceChartData[]>(
    () => (chartData?.earn ? convertPortfolioChartDataToPriceChartData(chartData.earn) : []),
    [chartData],
  )

  const hasTokensData = useMemo(() => seriesHasValue(tokensSeries), [tokensSeries])
  const hasPoolsData = useMemo(() => seriesHasValue(poolsSeries), [poolsSeries])
  const hasEarnData = useMemo(() => seriesHasValue(earnSeries), [earnSeries])

  const availableCategories = useMemo<PortfolioChartCategory[]>(() => {
    const hasDataByCategory = {
      [PortfolioChartCategory.Tokens]: hasTokensData,
      [PortfolioChartCategory.Earn]: hasEarnData,
      [PortfolioChartCategory.Pools]: hasPoolsData,
    }
    return PORTFOLIO_BREAKDOWN_CATEGORIES.filter((category) => hasDataByCategory[category])
  }, [hasTokensData, hasEarnData, hasPoolsData])

  const hasCategoryBreakdown = availableCategories.length >= 2

  const series = useMemo<PriceChartData[]>(() => {
    switch (selectedCategory) {
      case PortfolioChartCategory.Tokens:
        return tokensSeries
      case PortfolioChartCategory.Pools:
        return poolsSeries
      case PortfolioChartCategory.Earn:
        return earnSeries
      case PortfolioChartCategory.Total:
      default:
        return totalSeries
    }
  }, [selectedCategory, totalSeries, tokensSeries, poolsSeries, earnSeries])

  const chartPercentChange = useMemo<ChartPercentChange>(
    () => seriesPercentChange(series, selectedPeriod),
    [series, selectedPeriod],
  )

  const tokensPercentChange = useMemo<number | undefined>(
    () => seriesPercentChange(tokensSeries, selectedPeriod)?.percentChange,
    [tokensSeries, selectedPeriod],
  )

  const poolsPercentChange = useMemo<number | undefined>(
    () => seriesPercentChange(poolsSeries, selectedPeriod)?.percentChange,
    [poolsSeries, selectedPeriod],
  )

  const earnPercentChange = useMemo<number | undefined>(
    () => seriesPercentChange(earnSeries, selectedPeriod)?.percentChange,
    [earnSeries, selectedPeriod],
  )

  return {
    series,
    tokensSeries,
    poolsSeries,
    earnSeries,
    chartPercentChange,
    tokensPercentChange,
    poolsPercentChange,
    earnPercentChange,
    availableCategories,
    hasCategoryBreakdown,
  }
}
