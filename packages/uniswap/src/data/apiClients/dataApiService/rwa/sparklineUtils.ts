import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import type { RwaSparkline } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

export type RwaSparklineChartPoint = ChartPoint

/** Chart point shape for asset sparkline UI components. */
export type AssetSparklineChartPoint = RwaSparklineChartPoint

export function rwaSparklineToChartPoints(sparkline?: RwaSparkline | null): RwaSparklineChartPoint[] {
  const points = sparkline?.points ?? []
  return points.map((point) => ({
    timestamp: point.timestampS,
    value: point.value,
  }))
}
