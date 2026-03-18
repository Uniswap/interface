import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { nearestUsableTick } from '@uniswap/v3-sdk'
import { logger } from 'utilities/src/logger/logger'
import { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'
import { getDisplayPriceFromTick } from '~/utils/getTickToPrice'

/**
 * Canonical segment with piecewise-constant liquidity.
 * Represents a contiguous range where liquidity doesn't change.
 */
interface LiquiditySegment {
  startTick: number
  endTick: number
  liquidityActive: bigint
}

/**
 * Bucket for visualization - aggregates multiple segments.
 * The number of buckets is controlled by zoom level.
 */
interface LiquidityBucket {
  startTick: number
  endTick: number
  liquidityActive: bigint // Max liquidity in this bucket
  price0?: number // Optional price at bucket center
  /** The start tick of the underlying liquidity segment this bucket belongs to */
  segmentStartTick: number
  /** The end tick of the underlying liquidity segment this bucket belongs to */
  segmentEndTick: number
}

/**
 * Bucket chart entry extends the bucket interface and adds the locked amounts
 * amount0Locked and amount1Locked are calculated from the underlying liquidity segment
 */
export interface BucketChartEntry extends LiquidityBucket {
  /** Locked amount of token0 in this bucket range */
  amount0Locked?: number
  /** Locked amount of token1 in this bucket range */
  amount1Locked?: number
}

/**
 * Step 1: Build segments from raw ticks with liquidityNet values.
 * Uses prefix sum to compute active liquidity at each segment.
 *
 * Algorithm:
 * - currentLiquidity = 0n
 * - For each index i from 0 .. ticks.length - 2:
 *   - currentLiquidity += liquidityNet[i]
 *   - Create a segment: { startTick, endTick, liquidityActive }
 */
export function buildSegmentsFromRawTicks(rawTicks: TickData[]): LiquiditySegment[] {
  const ticks = rawTicks.filter((t) => t !== undefined)
  const segments: LiquiditySegment[] = []

  let currentLiquidity = 0n

  for (let i = 0; i < ticks.length - 1; i++) {
    const liquidityNet = ticks[i].liquidityNet
    const startTick = ticks[i].tick
    const endTick = ticks[i + 1].tick
    if (liquidityNet === undefined || startTick === undefined || endTick === undefined) {
      logger.error('buildSegmentsFromRawTicks', {
        tags: {
          file: 'liquidityBucketing',
          function: 'buildSegmentsFromRawTicks',
        },
        extra: {
          ticks,
        },
      })
      throw new Error('Invalid tick data')
    }

    currentLiquidity += BigInt(liquidityNet)

    segments.push({
      startTick,
      endTick,
      liquidityActive: currentLiquidity,
    })
  }

  return segments
}

/**
 * Step 2: Choose bucket boundaries aligned to tick spacing
 */
function getBucketBoundaries({
  visibleMinTick,
  visibleMaxTick,
  desiredBars,
  tickSpacing,
}: {
  visibleMinTick: number
  visibleMaxTick: number
  desiredBars: number
  tickSpacing: number
}): number[] {
  // Snap min/max to valid tick boundaries
  const snappedMin = nearestUsableTick(Math.floor(visibleMinTick), tickSpacing)
  const snappedMax = nearestUsableTick(Math.ceil(visibleMaxTick), tickSpacing)

  // Calculate step size that's a multiple of tickSpacing
  const range = snappedMax - snappedMin
  const rawStep = range / desiredBars
  // Round step to nearest multiple of tickSpacing (minimum 1 tickSpacing)
  const step = Math.max(tickSpacing, Math.round(rawStep / tickSpacing) * tickSpacing)

  // Generate boundaries aligned to tickSpacing
  const boundaries: number[] = []
  for (let tick = snappedMin; tick <= snappedMax; tick += step) {
    boundaries.push(tick)
  }
  // Ensure we include the snapped max
  if (boundaries[boundaries.length - 1] < snappedMax) {
    boundaries.push(snappedMax)
  }

  return boundaries
}

/**
 * Find the maximum liquidity among all segments that overlap with [startTick, endTick)
 * Also returns the segment that contributes the max liquidity for segment highlighting
 */
function findMaxLiquidityInBucket({
  segments,
  startTick,
  endTick,
}: {
  segments: LiquiditySegment[]
  startTick: number
  endTick: number
}): { maxLiquidity: bigint; segment: LiquiditySegment | undefined } {
  let maxLiquidity = 0n
  let maxSegment: LiquiditySegment | undefined

  for (const segment of segments) {
    // Check if segment overlaps with bucket
    if (segment.startTick < endTick && segment.endTick > startTick) {
      if (segment.liquidityActive > maxLiquidity) {
        maxLiquidity = segment.liquidityActive
        maxSegment = segment
      }
    }
  }

  return { maxLiquidity, segment: maxSegment }
}

/**
 * Step 3: Create buckets with liquidityActive and segment tracking
 */
export function buildBuckets({
  segments,
  visibleMinTick,
  visibleMaxTick,
  desiredBars,
  tickSpacing,
}: {
  segments: LiquiditySegment[]
  visibleMinTick: number
  visibleMaxTick: number
  desiredBars: number
  tickSpacing: number
}): LiquidityBucket[] {
  if (segments.length === 0) {
    return []
  }

  const boundaries = getBucketBoundaries({ visibleMinTick, visibleMaxTick, desiredBars, tickSpacing })

  const buckets: LiquidityBucket[] = []

  for (let j = 0; j < boundaries.length - 1; j++) {
    const startTick = boundaries[j]
    const endTick = boundaries[j + 1]

    // Find max liquidity among overlapping segments and track which segment it came from
    const { maxLiquidity, segment } = findMaxLiquidityInBucket({ segments, startTick, endTick })

    if (!segment) {
      continue
    }

    buckets.push({
      startTick,
      endTick,
      liquidityActive: maxLiquidity,
      segmentStartTick: segment.startTick,
      segmentEndTick: segment.endTick,
    })
  }

  return buckets
}

/**
 * Step 4: Create bucket chart entries with locked amounts
 *
 * - For each bucket, find the liquidity data entries that overlap with the bucket
 * - Sum the locked amounts from all entries within the bucket's tick range
 */
export function buildBucketChartEntries({
  buckets,
  liquidityData,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
}: {
  buckets: LiquidityBucket[]
  liquidityData: ChartEntry[]
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}): BucketChartEntry[] {
  const bucketData: BucketChartEntry[] = buckets.map((b) => {
    let entries = liquidityData.filter((e) => e.tick >= b.startTick && e.tick < b.endTick)
    // Floor lookup: the active tick may be before the segment start but its
    // liquidity still covers this bucket.
    if (entries.length === 0) {
      let floor: ChartEntry | undefined
      for (const e of liquidityData) {
        if (e.tick <= b.startTick) {
          floor = e
        } else {
          break
        }
      }
      if (floor) {
        entries = [floor]
      }
    }
    const amount0Locked = entries.reduce((sum, e) => sum + (e.amount0Locked ?? 0), 0)
    const amount1Locked = entries.reduce((sum, e) => sum + (e.amount1Locked ?? 0), 0)

    const price0 = getDisplayPriceFromTick({
      tick: b.startTick,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      priceInverted,
    })

    return {
      startTick: b.startTick,
      endTick: b.endTick,
      liquidityActive: b.liquidityActive,
      price0,
      amount0Locked,
      amount1Locked,
      segmentStartTick: b.segmentStartTick,
      segmentEndTick: b.segmentEndTick,
    }
  })

  return bucketData
}
