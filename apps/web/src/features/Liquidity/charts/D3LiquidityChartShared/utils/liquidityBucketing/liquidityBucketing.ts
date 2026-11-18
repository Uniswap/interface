import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { logger } from 'utilities/src/logger/logger'
import {
  searchSortedTick,
  sumAmountsOverTicks,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/sumAmountsOverTicks'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { TickData } from '~/features/Liquidity/types/ticks'
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
  /** Locked amount of token0 in the bucket's max-liquidity segment ([segmentStartTick, segmentEndTick)) */
  amount0Locked?: number
  /** Locked amount of token1 in the bucket's max-liquidity segment ([segmentStartTick, segmentEndTick)) */
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
export function buildSegmentsFromRawTicks(ticks: TickData[]): LiquiditySegment[] {
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

// Dwarfs the floating-point noise in axis-derived tick spans (~1e-12) yet is far smaller than any genuine step
// change, so a step quantized from such a span stays put frame-to-frame. See getBucketBoundaries.
const STEP_ROUNDING_EPSILON = 1e-9

/**
 * Boundaries every `step` ticks, anchored to multiples of `step` from tick 0 so they don't drift as the view
 * pans, extended one step past each edge so bars are fully formed as they scroll into view, and clamped into
 * the valid tick range — boundaries flow into TickMath downstream, which throws on out-of-range ticks
 * ("Invariant failed: TICK").
 */
function getFixedGridBoundaries({
  visibleMinTick,
  visibleMaxTick,
  step,
  tickSpacing,
}: {
  visibleMinTick: number
  visibleMaxTick: number
  step: number
  tickSpacing: number
}): number[] {
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
    const step = Math.max(tickSpacing, Math.round(rawStep / tickSpacing + STEP_ROUNDING_EPSILON) * tickSpacing)
    return getFixedGridBoundaries({ visibleMinTick, visibleMaxTick, step, tickSpacing })
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
  return fillBuckets({ segments, boundaries })
}

/** Liquidity of each [boundaries[j], boundaries[j + 1]) bucket: its max-liquidity overlapping segment. */
function fillBuckets({
  segments,
  boundaries,
}: {
  segments: LiquiditySegment[]
  boundaries: number[]
}): LiquidityBucket[] {
  const buckets: LiquidityBucket[] = []
  // Segments come sorted from the ticks, which lets one forward sweep serve every bucket (boundaries ascend)
  // instead of scanning all segments per bucket — that's thousands of buckets × segments per frame at full
  // granularity. Same picks as the scan: the first segment, in order, with the strictly highest liquidity.
  const canSweep = segments.every((segment, i) => i === 0 || segments[i - 1].startTick <= segment.startTick)
  let cursor = 0

  for (let j = 0; j < boundaries.length - 1; j++) {
    const startTick = boundaries[j]
    const endTick = boundaries[j + 1]

    let maxLiquidity = 0n
    let segment: LiquiditySegment | undefined
    if (canSweep) {
      // Buckets ascend, so a segment that ends at or before this one's start can't reach a later one either.
      while (cursor < segments.length && segments[cursor].endTick <= startTick) {
        cursor++
      }
      for (let k = cursor; k < segments.length && segments[k].startTick < endTick; k++) {
        const candidate = segments[k]
        if (candidate.endTick > startTick && candidate.liquidityActive > maxLiquidity) {
          maxLiquidity = candidate.liquidityActive
          segment = candidate
        }
      }
    } else {
      const found = findMaxLiquidityInBucket({ segments, startTick, endTick })
      maxLiquidity = found.maxLiquidity
      segment = found.segment
    }

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
 * Bucket size for full tick granularity: one tick spacing per bar, or as few whole spacings as keep a bar at
 * least `minBarPx` along the tick axis when more spacings are in view than pixels.
 * `ticksPerPixel` comes from the zoom alone, so the step only changes on a zoom, never on a pan.
 */
export function getFullGranularityStep({
  tickSpacing,
  ticksPerPixel,
  minBarPx = 1,
}: {
  tickSpacing: number
  ticksPerPixel: number
  minBarPx?: number
}): number {
  const spacingsPerBar = Math.ceil((ticksPerPixel * minBarPx) / tickSpacing - STEP_ROUNDING_EPSILON)
  return Math.max(1, spacingsPerBar) * tickSpacing
}

/**
 * Buckets at full tick granularity (see getFullGranularityStep) for the visible range, on the same fixed grid
 * as `buildBuckets({ fixedGrid: true })` so bars translate with a pan instead of re-tiling.
 */
export function buildFullGranularityBuckets({
  segments,
  visibleMinTick,
  visibleMaxTick,
  tickSpacing,
  ticksPerPixel,
}: {
  segments: LiquiditySegment[]
  visibleMinTick: number
  visibleMaxTick: number
  tickSpacing: number
  ticksPerPixel: number
}): LiquidityBucket[] {
  if (segments.length === 0) {
    return []
  }
  const step = getFullGranularityStep({ tickSpacing, ticksPerPixel })
  const boundaries = getFixedGridBoundaries({ visibleMinTick, visibleMaxTick, step, tickSpacing })
  return fillBuckets({ segments, boundaries })
}

/**
 * Step 4: Create bucket chart entries with locked amounts
 *
 * - For each bucket, find the liquidity data entries inside the bucket's max-liquidity segment
 * - Sum the locked amounts from all entries within that segment's tick range
 *
 * Amounts are scoped to the segment — not the whole bucket — so every quantity a bar exposes
 * describes the same tick range: the bar's height is the max-liquidity segment's L, and the
 * tooltip shows that segment's price range and divides these amounts by that segment's bps
 * width. A bucket that merges several segments (whenever more than DESIRED_BUCKETS segments
 * are in view) would otherwise sum USD across all of them while the tooltip divides by one
 * segment's width, inflating $/bps independently of bar height (LP-288).
 *
 * With `amountScope: 'bucket'` the amounts are the whole bucket's instead, for a tooltip that shows and divides
 * by the bucket's own range (see TickTooltipContent's `priceSpan`).
 */
export function buildBucketChartEntries({
  buckets,
  liquidityData,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
  getPrice0,
  amountScope = 'segment',
}: {
  buckets: LiquidityBucket[]
  liquidityData: ChartEntry[]
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  /** Display price at a bucket's start tick; the SDK's by default, which is too slow for thousands of buckets. */
  getPrice0?: (tick: number) => number | undefined
  /** What the amounts cover: the bucket's max-liquidity segment, or the whole bucket. */
  amountScope?: 'segment' | 'bucket'
}): BucketChartEntry[] {
  // Binary search when the entries ascend by tick (they do as built); the linear scans below otherwise.
  const isSortedByTick = liquidityData.every((e, i) => i === 0 || liquidityData[i - 1].tick <= e.tick)
  const getSegmentEntries = (b: LiquidityBucket): ChartEntry[] => {
    if (isSortedByTick) {
      const entries = liquidityData.slice(
        searchSortedTick({ entries: liquidityData, tick: b.segmentStartTick, atOrPast: true }),
        searchSortedTick({ entries: liquidityData, tick: b.segmentEndTick - 1 }),
      )
      if (entries.length > 0) {
        return entries
      }
      const floorIndex = searchSortedTick({ entries: liquidityData, tick: b.segmentStartTick }) - 1
      return floorIndex >= 0 ? [liquidityData[floorIndex]] : []
    }
    const entries = liquidityData.filter((e) => e.tick >= b.segmentStartTick && e.tick < b.segmentEndTick)
    // Floor lookup: the segment's covering entry may start before segmentStartTick (e.g. the
    // synthetic active-tick entry replaces the initialized tick at the segment start).
    if (entries.length === 0) {
      let floor: ChartEntry | undefined
      for (const e of liquidityData) {
        if (e.tick <= b.segmentStartTick) {
          floor = e
        } else {
          break
        }
      }
      if (floor) {
        return [floor]
      }
    }
    return entries
  }

  // Amounts depend only on the segment, which runs of adjacent buckets share at full granularity.
  const amountsBySegment = new Map<string, { amount0Locked: number; amount1Locked: number }>()
  const getSegmentAmounts = (b: LiquidityBucket): { amount0Locked: number; amount1Locked: number } => {
    const key = `${b.segmentStartTick}:${b.segmentEndTick}`
    const cached = amountsBySegment.get(key)
    if (cached) {
      return cached
    }
    const entries = getSegmentEntries(b)
    const amounts = {
      amount0Locked: entries.reduce((sum, e) => sum + (e.amount0Locked ?? 0), 0),
      amount1Locked: entries.reduce((sum, e) => sum + (e.amount1Locked ?? 0), 0),
    }
    amountsBySegment.set(key, amounts)
    return amounts
  }

  const sortedData = isSortedByTick ? liquidityData : [...liquidityData].sort((a, b) => a.tick - b.tick)

  const priceAtTick =
    getPrice0 ??
    ((tick: number) => getDisplayPriceFromTick({ tick, baseCurrency, quoteCurrency, protocolVersion, priceInverted }))

  return buckets.map((b) => {
    const { amount0Locked, amount1Locked } =
      amountScope === 'bucket'
        ? sumAmountsOverTicks({ entries: sortedData, startTick: b.startTick, endTick: b.endTick })
        : getSegmentAmounts(b)
    return {
      startTick: b.startTick,
      endTick: b.endTick,
      liquidityActive: b.liquidityActive,
      price0: priceAtTick(b.startTick),
      amount0Locked,
      amount1Locked,
      segmentStartTick: b.segmentStartTick,
      segmentEndTick: b.segmentEndTick,
    }
  })
}

/**
 * The display price at a tick, as `getDisplayPriceFromTick` gives it (8 significant digits), in closed form:
 * the SDK prices tick 0 (a power of ten, exact at 8 digits) and tick 1, for the decimals and orientation, and
 * every other tick is 1.0001^±tick from there. Thousands of buckets a frame can't afford the SDK's big-number math.
 */
export function createDisplayPriceAtTick({
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
}: {
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}): (tick: number) => number | undefined {
  const priceAt = (tick: number) =>
    getDisplayPriceFromTick({ tick, baseCurrency, quoteCurrency, priceInverted, protocolVersion })
  const priceAtZero = priceAt(0)
  const priceAtOne = priceAt(1)
  if (priceAtZero === undefined || priceAtOne === undefined || priceAtZero <= 0) {
    return priceAt
  }
  const direction = priceAtOne >= priceAtZero ? 1 : -1
  return (tick: number) => Number((priceAtZero * 1.0001 ** (direction * tick)).toPrecision(8))
}
