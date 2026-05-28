import { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'

export function findBucketForTick(tick: number, buckets: BucketChartEntry[]): BucketChartEntry | undefined {
  return buckets.find((b) => tick >= b.startTick && tick < b.endTick)
}

export function createEntryFromBucket({ bucket, tick }: { bucket: BucketChartEntry; tick: number }): ChartEntry {
  return {
    tick,
    liquidityActive: Number(bucket.liquidityActive),
    price0: bucket.price0 ?? 0,
    amount0Locked: bucket.amount0Locked ?? 0,
    amount1Locked: bucket.amount1Locked ?? 0,
    bucket: {
      startTick: bucket.startTick,
      endTick: bucket.endTick,
    },
    segment: {
      startTick: bucket.segmentStartTick,
      endTick: bucket.segmentEndTick,
    },
  }
}

export function findClosestBucket(tick: number, buckets: BucketChartEntry[]): BucketChartEntry | undefined {
  if (buckets.length === 0) {
    return undefined
  }
  return buckets.reduce((prev, curr) => {
    const prevCenter = (prev.startTick + prev.endTick) / 2
    const currCenter = (curr.startTick + curr.endTick) / 2
    return Math.abs(currCenter - tick) < Math.abs(prevCenter - tick) ? curr : prev
  })
}
