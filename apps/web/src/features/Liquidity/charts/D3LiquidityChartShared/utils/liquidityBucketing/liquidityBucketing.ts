import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { logger } from 'utilities/src/logger/logger'
import { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'

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
      continue
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
  fixedGrid = false,
}: {
  visibleMinTick: number
  visibleMaxTick: number
  desiredBars: number
  tickSpacing: number
  /**
   * When true, anchor bucket boundaries to a global grid (multiples of `step` from tick 0) and
   * derive `step` from the raw viewport span — which depends only on zoom, not pan. This keeps a
   * given bucket's tick range identical frame-to-frame while scrolling, so bars translate smoothly
   * with the pan instead of jittering as a viewport-anchored grid slides underneath them.
   */
  fixedGrid?: boolean
}): number[] {
  if (fixedGrid) {
    // Step from the raw (unsnapped) viewport span: this is pan-independent, so it stays constant
    // while scrolling and the grid doesn't re-tile (it only changes on zoom).
    const rawRange = Math.max(tickSpacing, visibleMaxTick - visibleMinTick)
    const rawStep = rawRange / desiredBars
    // Quantize the step to a whole number of tick-spacings. `rawStep / tickSpacing` is
    // pan-independent (it derives from the zoom-only viewport span), but it can land exactly on an
    // N.5 boundary — and because visibleMin/MaxTick come from axis math, the last bit of
    // floating-point noise then flips Math.round between N and N+1 on consecutive frames. That flip
    // re-tiles the whole grid (every bar changes width and snaps to a new x), which is the
    // horizontal jitter seen while scrolling. Bias the half-way case up by an epsilon that dwarfs
    // the FP noise (~1e-12) yet is far smaller than any genuine step change, so the step is stable
    // frame-to-frame and only ever changes on a real zoom.
    const STEP_ROUNDING_EPSILON = 1e-9
    const step = Math.max(tickSpacing, Math.round(rawStep / tickSpacing + STEP_ROUNDING_EPSILON) * tickSpacing)

    // Align to multiples of `step` from the global origin (so boundaries don't drift as you pan),
    // extend one bucket past each edge so bars are fully formed as they scroll into view, and clamp
    // into the valid tick range — boundaries flow into TickMath downstream, which throws on
    // out-of-range ticks ("Invariant failed: TICK").
    const minUsableTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
    const maxUsableTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
    const gridStart = Math.max(minUsableTick, Math.floor(visibleMinTick / step) * step - step)
    const gridEnd = Math.min(maxUsableTick, Math.ceil(visibleMaxTick / step) * step + step)

    const boundaries: number[] = []
    for (let tick = gridStart; tick < gridEnd; tick += step) {
      boundaries.push(tick)
    }
    // Ensure the final boundary reaches gridEnd (which may be clamped and not step-aligned).
    if (boundaries[boundaries.length - 1] !== gridEnd) {
      boundaries.push(gridEnd)
    }

    return boundaries
  }

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
  fixedGrid = false,
}: {
  segments: LiquiditySegment[]
  visibleMinTick: number
  visibleMaxTick: number
  desiredBars: number
  tickSpacing: number
  /** Anchor boundaries to a global grid so bars don't jitter while scrolling. See getBucketBoundaries. */
  fixedGrid?: boolean
}): LiquidityBucket[] {
  if (segments.length === 0) {
    return []
  }

  const boundaries = getBucketBoundaries({ visibleMinTick, visibleMaxTick, desiredBars, tickSpacing, fixedGrid })

  const buckets: LiquidityBucket[] = []

  for (let j = 0; j < boundaries.length - 1; j++) {
    const startTick = boundaries[j]
    const endTick = boundaries[j + 1]

    // Find max liquidity among overlapping segments and track which segment it came from
    const { maxLiquidity, segment } = findMaxLiquidityInBucket({ segments, startTick, endTick })

    buckets.push({
      startTick,
      endTick,
      liquidityActive: maxLiquidity,
      segmentStartTick: segment?.startTick ?? startTick,
      segmentEndTick: segment?.endTick ?? endTick,
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
