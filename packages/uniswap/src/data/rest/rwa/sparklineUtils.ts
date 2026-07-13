import type { RwaSparkline } from 'uniswap/src/data/rest/rwa/types'

export type RwaSparklineChartPoint = {
  timestamp: number
  value: number
}

/** Chart point shape for asset sparkline UI components. */
export type AssetSparklineChartPoint = RwaSparklineChartPoint

export function rwaSparklineToChartPoints(sparkline?: RwaSparkline | null): RwaSparklineChartPoint[] {
  const points = sparkline?.points ?? []
  return points.map((point) => ({
    timestamp: point.timestampS,
    value: point.value,
  }))
}
