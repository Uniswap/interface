import { ChartPeriod, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { PriceChartData } from '~/components/Charts/PriceChart'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

interface UsePortfolioChartSeriesInput {
  chartData: GetPortfolioChartResponse | undefined
  selectedPeriod: ChartPeriod
}

interface UsePortfolioChartSeriesResult {
  series: PriceChartData[]
  chartPercentChange: ChartPercentChange
}

function convertPortfolioChartDataToPriceChartData(
  points: Array<{ timestamp: bigint; value: number }>,
): PriceChartData[] {
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
 * Lifts portfolio chart series transformation and percent-change calculation
 * out of PortfolioChart so the balance header and the chart can share a
 * single source of truth.
 */
export function usePortfolioChartSeries({
  chartData,
  selectedPeriod,
}: UsePortfolioChartSeriesInput): UsePortfolioChartSeriesResult {
  const series = useMemo<PriceChartData[]>(() => {
    if (!chartData?.points) {
      return []
    }
    return convertPortfolioChartDataToPriceChartData(chartData.points)
  }, [chartData])

  const chartPercentChange = useMemo<ChartPercentChange>(() => {
    if (selectedPeriod === ChartPeriod.MAX) {
      return undefined
    }
    return getPortfolioChartPercentChange(series.map((d) => d.close))
  }, [series, selectedPeriod])

  return { series, chartPercentChange }
}
