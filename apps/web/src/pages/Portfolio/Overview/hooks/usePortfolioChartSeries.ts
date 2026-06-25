import { ChartPeriod, ChartPoint, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { PriceChartData } from '~/components/Charts/PriceChart'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

export enum PortfolioChartCategory {
  Total = 'total',
  Tokens = 'tokens',
  Pools = 'pools',
}

interface UsePortfolioChartSeriesInput {
  chartData: GetPortfolioChartResponse | undefined
  selectedPeriod: ChartPeriod
  selectedCategory: PortfolioChartCategory
}

interface UsePortfolioChartSeriesResult {
  series: PriceChartData[]
  /** Per-category series (shared timestamps), used to read tokens/pools values at the scrubbed point. */
  tokensSeries: PriceChartData[]
  poolsSeries: PriceChartData[]
  chartPercentChange: ChartPercentChange
  /** Period percent change per category (first-to-last of the series), for the breakdown rows at rest. */
  tokensPercentChange: number | undefined
  poolsPercentChange: number | undefined
  /** True only when both tokens and pools have a non-zero value, so the selector has both to choose from. */
  hasCategoryBreakdown: boolean
}

/** Period percent change over a series (first-to-last), or `undefined` for the all-time period. */
function seriesPercentChange(series: PriceChartData[], selectedPeriod: ChartPeriod): ChartPercentChange {
  if (selectedPeriod === ChartPeriod.MAX) {
    return undefined
  }
  return getPortfolioChartPercentChange(series.map((d) => d.close))
}

function convertPortfolioChartDataToPriceChartData(points: ChartPoint[]): PriceChartData[] {
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

  const hasTokensData = useMemo(() => tokensSeries.some((point) => point.close !== 0), [tokensSeries])
  const hasPoolsData = useMemo(() => poolsSeries.some((point) => point.close !== 0), [poolsSeries])
  const hasCategoryBreakdown = hasTokensData && hasPoolsData

  const series = useMemo<PriceChartData[]>(() => {
    switch (selectedCategory) {
      case PortfolioChartCategory.Tokens:
        return tokensSeries
      case PortfolioChartCategory.Pools:
        return poolsSeries
      case PortfolioChartCategory.Total:
      default:
        return totalSeries
    }
  }, [selectedCategory, totalSeries, tokensSeries, poolsSeries])

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

  return {
    series,
    tokensSeries,
    poolsSeries,
    chartPercentChange,
    tokensPercentChange,
    poolsPercentChange,
    hasCategoryBreakdown,
  }
}
