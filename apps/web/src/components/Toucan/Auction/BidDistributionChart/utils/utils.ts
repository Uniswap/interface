import { formatUnits } from 'viem'
import type { ChartMode } from '~/components/Charts/ToucanChart/renderer'
import {
  CHART_CONSTRAINTS,
  DEFAULT_Y_AXIS_LEVELS,
  LABEL_GENERATION,
  MAX_RENDERABLE_BARS,
  NICE_VALUES,
  TOLERANCE,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'
import {
  BidConcentrationResult,
  calculateBidConcentration,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import {
  calculateTickQ96,
  fromQ96ToDecimalWithTokenDecimals,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { BidDistributionData, BidTokenInfo, OptimisticBid, UserBid } from '~/components/Toucan/Auction/store/types'
import { approximateNumberFromRaw } from '~/components/Toucan/Auction/utils/fixedPointFdv'

/* eslint-disable max-lines -- TODO(Toucan): refactor/ split into smaller modules */
/**
 * Represents a single bar in the distribution chart
 */
// eslint-disable-next-line import/no-unused-modules
export interface ChartBarData {
  tick: number // Tick value in smallest unit (decimal, for chart rendering)
  tickQ96: string // Original Q96 string for precise matching and click handling
  tickDisplay: string // Formatted tick for display
  amount: number // Bid amount in USD (converted from base token using bidTokenInfo.priceFiat)
  index: number // Bar index for positioning
}

/**
 * Processed chart data with calculated axis information
 */
// eslint-disable-next-line import/no-unused-modules
export interface ProcessedChartData {
  bars: ChartBarData[]
  yAxisLevels: number[]
  minTick: number
  maxTick: number
  maxAmount: number
  /** Total bid volume including all entries (even those outside the windowed bars) */
  totalBidVolume: number
  labelIncrement?: number
  concentration: BidConcentrationResult | null
  /** The max tick from actual bid data (before any extension). Used for auto-clearing custom bid tick. */
  maxTickFromData: number
}

function parseBigInt(value: string): bigint | null {
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

export function mergeUserBidVolumes(params: {
  bidDistributionData: BidDistributionData | null
  userBids: UserBid[]
  optimisticBid?: OptimisticBid | null
}): BidDistributionData | null {
  const { bidDistributionData, userBids, optimisticBid } = params

  if (!bidDistributionData) {
    return bidDistributionData
  }

  if (userBids.length === 0 && !optimisticBid) {
    return bidDistributionData
  }

  const aggregatedVolumes = new Map<string, bigint>()

  const addVolume = (tickQ96: string | undefined, volumeRaw: string | undefined): void => {
    if (!tickQ96 || !volumeRaw) {
      return
    }

    const volume = parseBigInt(volumeRaw)
    if (!volume || volume <= 0n) {
      return
    }

    const current = aggregatedVolumes.get(tickQ96) ?? 0n
    aggregatedVolumes.set(tickQ96, current + volume)
  }

  userBids.forEach((bid) => {
    addVolume(bid.maxPrice, bid.baseTokenInitial)
  })

  if (optimisticBid) {
    addVolume(optimisticBid.maxPriceQ96, optimisticBid.budgetRaw)
  }

  if (aggregatedVolumes.size === 0) {
    return bidDistributionData
  }

  let updatedMap: BidDistributionData | null = null

  aggregatedVolumes.forEach((userVolume, tickQ96) => {
    const existingRaw = bidDistributionData.get(tickQ96)
    const existingVolume = existingRaw ? (parseBigInt(existingRaw) ?? 0n) : 0n

    if (userVolume > existingVolume) {
      if (!updatedMap) {
        updatedMap = new Map(bidDistributionData)
      }
      updatedMap.set(tickQ96, userVolume.toString())
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- updatedMap may be set inside forEach
  return updatedMap ?? bidDistributionData
}

/**
 * Converts a value from smallest unit to decimal using viem's formatUnits
 *
 * @param value - Value in smallest unit (as string)
 * @param decimals - Number of decimals
 * @returns Decimal number
 */
function toDecimal(value: string, decimals: number): number {
  return Number(formatUnits(BigInt(value), decimals))
}

/**
 * Calculate bar step size and range for the chart
 * Rules:
 * 1. Minimum 20 bars total
 * 2. Bars step by tick_size multiples
 * 3. Range extends beyond data if needed to reach 20 bars
 */
function calculateBarStepAndRange(params: { minTick: number; maxTick: number; tickSize: number }): {
  barStep: number // Step size between bars (multiple of tick_size)
  rangeMax: number // Adjusted max tick to achieve min 20 bars
  totalBars: number // Total number of bars
} {
  const { minTick, maxTick, tickSize } = params

  // Calculate how many tick_size steps exist in the data range
  const dataSteps = Math.round((maxTick - minTick) / tickSize) + 1

  if (dataSteps >= CHART_CONSTRAINTS.MIN_BARS) {
    // We have enough steps, use them all
    return {
      barStep: tickSize,
      rangeMax: maxTick,
      totalBars: dataSteps,
    }
  } else {
    // Need to extend range to reach MIN_BARS
    // Calculate how many tick_size steps needed beyond maxTick
    const additionalSteps = CHART_CONSTRAINTS.MIN_BARS - dataSteps
    const rangeMax = maxTick + additionalSteps * tickSize

    return {
      barStep: tickSize,
      rangeMax,
      totalBars: CHART_CONSTRAINTS.MIN_BARS,
    }
  }
}

function getTickIndex(params: {
  tick: number
  floorTick: number
  tickSize: number
  rounding?: 'round' | 'floor'
}): number {
  const { tick, floorTick, tickSize, rounding = 'round' } = params
  const rawIndex = (tick - floorTick) / tickSize
  return rounding === 'floor' ? Math.floor(rawIndex) : Math.round(rawIndex)
}

function getTickFromIndex(params: { index: number; floorTick: number; tickSize: number }): number {
  const { index, floorTick, tickSize } = params
  return floorTick + index * tickSize
}

/**
 * Normalizes a value to its order of magnitude and normalized form
 * @param value - The value to normalize
 * @returns Object with magnitude (power of 10) and normalized value (1-10 range)
 */
function normalizeValue(value: number): { magnitude: number; normalized: number } {
  if (value <= 0) {
    return { magnitude: 1, normalized: 1 }
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  return { magnitude, normalized }
}

/**
 * Rounds a number to the nearest "nice" value for chart labels
 * Nice values are typically 1, 2, 5 (or with 2.5 for finer granularity)
 *
 * @example
 * roundToNiceNumber(350) // 500 (normalized: 3.5 rounds up to 5, magnitude: 100)
 * roundToNiceNumber(350, [1, 2, 2.5, 5]) // 500
 * roundToNiceNumber(230, [1, 2, 2.5, 5]) // 250 (2.5 * 100)
 *
 * @param value - The value to round
 * @param niceValues - Array of normalized "nice" values (default: NICE_VALUES.STANDARD)
 * @returns The rounded "nice" number
 */
function roundToNiceNumber(value: number, niceValues: readonly number[] = NICE_VALUES.STANDARD): number {
  const { magnitude, normalized } = normalizeValue(value)

  // Find the first nice value >= normalized
  for (const nice of niceValues) {
    if (normalized <= nice) {
      return nice * magnitude
    }
  }

  // If normalized exceeds all nice values, scale up to next magnitude
  return niceValues[0] * magnitude * 10
}

/**
 * Generates candidate multipliers dynamically based on the range
 * Creates "nice" round numbers that produce the target number of labels
 */
function generateDynamicCandidates(params: { minMultiplier: number; maxMultiplier: number }): number[] {
  const { minMultiplier, maxMultiplier } = params

  const candidates = new Set<number>()

  // Always include small multipliers for small ranges
  const baseMultipliers = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100]
  for (const m of baseMultipliers) {
    if (m >= minMultiplier && m <= maxMultiplier) {
      candidates.add(m)
    }
  }

  // Generate nice round numbers within the range
  // Use powers of 10, 5, and 2 to create nice increments
  let current = Math.max(1, minMultiplier)
  while (current <= maxMultiplier) {
    const rounded = roundToNiceNumber(current)
    if (rounded >= minMultiplier && rounded <= maxMultiplier) {
      candidates.add(rounded)
    }

    // Step by nice increments
    if (current < 10) {
      current += 1
    } else if (current < 100) {
      current += 10
    } else if (current < 1000) {
      current += 50
    } else {
      current += 100
    }
  }

  // Always include the boundary values rounded to nice numbers
  candidates.add(roundToNiceNumber(minMultiplier))
  candidates.add(roundToNiceNumber(maxMultiplier))

  return Array.from(candidates).sort((a, b) => a - b)
}

/**
 * Checks if a multiplier is a "nice" round number
 * Nice numbers are values like 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, etc.
 *
 * @example
 * isNiceMultiplier(50) // true (5 * 10)
 * isNiceMultiplier(75) // false (7.5 is not in [1, 2, 5])
 *
 * @param multiplier - The multiplier to check
 * @param niceValues - Array of normalized "nice" values (default: NICE_VALUES.STANDARD)
 * @returns true if the multiplier is a nice round number
 */
function isNiceMultiplier(multiplier: number, niceValues: readonly number[] = NICE_VALUES.STANDARD): boolean {
  const { normalized } = normalizeValue(multiplier)
  return niceValues.includes(normalized)
}

/**
 * Calculate x-axis label increment for optimal evenly spaced labels
 * Labels align with tick_size boundaries and aim for 7-12 total labels (or custom target)
 * Prefers "nice" round numbers (multiples of 1, 2, 5, 10, 20, 50, 100, etc.)
 * Dynamically handles any range size from tiny to extreme
 */
function calculateLabelIncrement(params: {
  minTick: number
  rangeMax: number
  tickSize: number
  targetMaxLabels?: number
}): number {
  const { minTick, rangeMax, tickSize, targetMaxLabels } = params
  const range = rangeMax - minTick

  const maxLabels = targetMaxLabels ?? LABEL_GENERATION.MAX_LABELS
  const minLabels = targetMaxLabels ? Math.max(2, targetMaxLabels - 2) : LABEL_GENERATION.MIN_LABELS
  const idealLabels = targetMaxLabels ?? LABEL_GENERATION.IDEAL_LABELS

  // Calculate theoretical multiplier bounds to achieve target label count
  // minMultiplier produces maxLabels, maxMultiplier produces minLabels
  const minMultiplier = Math.max(1, Math.ceil(range / (maxLabels * tickSize)))
  const maxMultiplier = Math.max(1, Math.floor(range / (minLabels * tickSize)))

  // Generate candidates dynamically based on the actual range
  const candidates = generateDynamicCandidates({ minMultiplier, maxMultiplier })

  let bestMultiplier = 0
  let bestScore = Infinity

  // Evaluate all candidates
  for (const multiplier of candidates) {
    const labelIncrement = multiplier * tickSize
    const numLabels = Math.floor(range / labelIncrement) + 1

    // Skip if outside acceptable range
    if (numLabels < minLabels || numLabels > maxLabels) {
      continue
    }

    // Score based on: distance from ideal count + preference for nice round numbers
    const countDiff = Math.abs(numLabels - idealLabels)
    const roundnessBonus = isNiceMultiplier(multiplier) ? -2 : 0
    const score = countDiff + roundnessBonus

    if (score < bestScore) {
      bestScore = score
      bestMultiplier = multiplier
    }
  }

  // Fallback: if no candidate produces acceptable labels, calculate the ideal multiplier
  if (bestMultiplier === 0) {
    const idealMultiplier = Math.max(1, Math.ceil(range / (idealLabels * tickSize)))
    bestMultiplier = roundToNiceNumber(idealMultiplier)

    // Validate the fallback produces acceptable label count
    const fallbackLabelCount = Math.floor(range / (bestMultiplier * tickSize)) + 1

    // If still outside range, relax to nearest boundary
    if (fallbackLabelCount < minLabels) {
      // Too few labels - reduce multiplier to increase label count
      bestMultiplier = Math.max(1, Math.floor(range / ((minLabels - 1) * tickSize)))
    } else if (fallbackLabelCount > maxLabels) {
      // Too many labels - increase multiplier to decrease label count
      bestMultiplier = Math.max(1, Math.ceil(range / ((maxLabels + 1) * tickSize)))
    }
  }

  return bestMultiplier * tickSize
}

/**
 * Calculate 6 Y-axis levels based on the maximum bid amount
 */
function calculateYAxisLevels(maxAmount: number): number[] {
  if (maxAmount === 0) {
    return [...DEFAULT_Y_AXIS_LEVELS]
  }

  // Calculate a nice increment for 5 steps (6 levels including 0), using Y-axis nice values (including 2.5)
  const niceIncrement = roundToNiceNumber(maxAmount / 5, NICE_VALUES.WITH_HALF)
  return [0, niceIncrement]
}

function calculateTickDisplayValue(params: {
  tickValue: number
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
}): number {
  const { tickValue, bidTokenInfo, totalSupply, auctionTokenDecimals = 18 } = params
  // Convert tick value to USD (tick is already in bid token units, multiply by price)
  // When priceFiat is 0 (unavailable), return 0 and let caller handle fallback display
  const tickInUSD = bidTokenInfo.priceFiat === 0 ? 0 : tickValue * bidTokenInfo.priceFiat

  // Always show as FDV: multiply by total supply
  if (!totalSupply) {
    return tickInUSD
  }

  // Convert totalSupply to an approximate decimal token count (avoid Number(formatUnits(...)) precision loss)
  const totalTokensApprox = approximateNumberFromRaw({
    raw: BigInt(totalSupply),
    decimals: auctionTokenDecimals,
    significantDigits: 15,
  })
  return tickInUSD * totalTokensApprox
}

/**
 * Format tick value for display (exported for chart component)
 * Uses provided formatter function for localized formatting
 * Always displays as FDV (Fully Diluted Valuation) when totalSupply is available
 */
export function formatTickForDisplay(params: {
  tickValue: number
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
  formatter: (amount: number) => string
}): string {
  const { formatter, ...rest } = params
  const displayValue = calculateTickDisplayValue(rest)
  return formatter(displayValue)
}

/**
 * Computes cumulative sum from right to left (highest tick to lowest) using all bid entries.
 * The bar at the lowest tick will have the total sum, decreasing rightward.
 * This represents "demand at or below this price" - how much volume would be filled
 * at each price point.
 *
 * Unlike the old computeCumulativeSum which only used windowed bars, this function
 * uses all entries to ensure cumulative volumes include bids outside the visible window.
 */
function computeCumulativeBarsFromEntries({
  bars,
  entries,
  tickSize,
  excludedVolumeAboveWindow = 0,
}: {
  bars: ChartBarData[]
  entries: { tick: number; amount: number }[]
  tickSize: number
  excludedVolumeAboveWindow?: number
}): ChartBarData[] {
  // Sort bars descending by tick (right-to-left cumulation)
  const sortedBars = [...bars].sort((a, b) => b.tick - a.tick)
  // Sort entries descending by tick
  const sortedEntries = [...entries].sort((a, b) => b.tick - a.tick)
  const tolerance = tickSize * TOLERANCE.TICK_COMPARISON

  // Start with excluded volume from early cap (bids above MAX_RENDERABLE_BARS cap)
  let cumulative = excludedVolumeAboveWindow
  let entryIndex = 0
  const result: ChartBarData[] = []

  for (const bar of sortedBars) {
    // Add all entries at or above this bar's tick to cumulative
    while (entryIndex < sortedEntries.length && sortedEntries[entryIndex].tick >= bar.tick - tolerance) {
      cumulative += sortedEntries[entryIndex].amount
      entryIndex += 1
    }
    result.push({ ...bar, amount: cumulative })
  }

  // Return in original tick order (ascending)
  return result.sort((a, b) => a.tick - b.tick)
}

/**
 * Generate chart data from raw bid distribution data
 */
export function generateChartData({
  bidData,
  bidTokenInfo,
  totalSupply,
  auctionTokenDecimals = 18,
  clearingPrice,
  floorPrice,
  tickSize,
  formatter,
  chartMode = 'distribution',
  excludedVolume,
  extendedMaxTick,
}: {
  bidData: BidDistributionData
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
  clearingPrice: string
  floorPrice: string
  tickSize: string
  formatter: (amount: number) => string
  chartMode?: ChartMode
  /** Volume from bids excluded due to MAX_RENDERABLE_BARS cap (raw string in bid token wei) */
  excludedVolume?: string | null
  /** Optional extended max tick (decimal form) for rendering out-of-range user bids */
  extendedMaxTick?: number | null
}): ProcessedChartData {
  // Convert tick_size from Q96 to decimal (prices are in Q96 format from contract)
  const tickSizeDecimal = fromQ96ToDecimalWithTokenDecimals({
    q96Value: tickSize,
    bidTokenDecimals: bidTokenInfo.decimals,
    auctionTokenDecimals,
  })

  // Convert map entries to sorted array using BigInt-safe conversion
  // Tick prices are in Q96 format, amounts are in token smallest units (wei)
  // Preserve original Q96 strings for precise matching in click handlers
  // When priceFiat is available, convert to USD; otherwise use bid token amounts for chart display
  const entries = Array.from(bidData.entries())
    .map(([tickQ96, amount]) => {
      const amountInBidToken = toDecimal(amount, bidTokenInfo.decimals)
      return {
        tick: fromQ96ToDecimalWithTokenDecimals({
          q96Value: tickQ96,
          bidTokenDecimals: bidTokenInfo.decimals,
          auctionTokenDecimals,
        }),
        tickQ96, // Preserve original Q96 string for precision
        amount: bidTokenInfo.priceFiat > 0 ? amountInBidToken * bidTokenInfo.priceFiat : amountInBidToken,
      }
    })
    .sort((a, b) => a.tick - b.tick)

  // Convert prices from Q96 to decimal (prices are in Q96 format from contract)
  const clearingPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
    q96Value: clearingPrice,
    bidTokenDecimals: bidTokenInfo.decimals,
    auctionTokenDecimals,
  })
  const floorPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
    q96Value: floorPrice,
    bidTokenDecimals: bidTokenInfo.decimals,
    auctionTokenDecimals,
  })

  const minTickFromData = Math.min(floorPriceDecimal, entries[0]?.tick ?? floorPriceDecimal)
  const maxTickFromEntries = Math.max(entries[entries.length - 1]?.tick ?? floorPriceDecimal, floorPriceDecimal)

  const minTickIndexAvailable = getTickIndex({
    tick: minTickFromData,
    floorTick: floorPriceDecimal,
    tickSize: tickSizeDecimal,
  })
  const maxTickIndexAvailable = getTickIndex({
    tick: maxTickFromEntries,
    floorTick: floorPriceDecimal,
    tickSize: tickSizeDecimal,
  })

  const clearingLowerIndex = getTickIndex({
    tick: clearingPriceDecimal,
    floorTick: floorPriceDecimal,
    tickSize: tickSizeDecimal,
    rounding: 'floor',
  })
  const firstAboveClearingIndex = clearingLowerIndex + 1
  const minRequiredMaxIndex = firstAboveClearingIndex + (CHART_CONSTRAINTS.MIN_TICKS_ABOVE_CLEARING_PRICE - 1)

  const totalTickCount = Math.max(1, maxTickIndexAvailable - minTickIndexAvailable + 1)

  let windowMinIndex = minTickIndexAvailable
  let windowMaxIndex = Math.max(maxTickIndexAvailable, minRequiredMaxIndex)

  if (totalTickCount > MAX_RENDERABLE_BARS) {
    const maxBelowAllowed = Math.max(0, MAX_RENDERABLE_BARS - CHART_CONSTRAINTS.MIN_TICKS_ABOVE_CLEARING_PRICE)
    const desiredBelowTicks = Math.min(CHART_CONSTRAINTS.PREFERRED_TICKS_BELOW_CLEARING_PRICE, maxBelowAllowed)
    const availableBelowTicks = Math.max(0, clearingLowerIndex - minTickIndexAvailable + 1)
    const belowTickCount = Math.min(desiredBelowTicks, availableBelowTicks)

    windowMinIndex = clearingLowerIndex - Math.max(0, belowTickCount - 1)
    windowMaxIndex = windowMinIndex + (MAX_RENDERABLE_BARS - 1)

    if (windowMaxIndex < minRequiredMaxIndex) {
      windowMaxIndex = minRequiredMaxIndex
      windowMinIndex = windowMaxIndex - (MAX_RENDERABLE_BARS - 1)
    }
  }

  // Store the original max tick from data before any extension
  const maxTickFromDataValue = getTickFromIndex({
    index: windowMaxIndex,
    floorTick: floorPriceDecimal,
    tickSize: tickSizeDecimal,
  })

  // If extendedMaxTick is provided and beyond current range, extend windowMaxIndex
  if (extendedMaxTick && extendedMaxTick > maxTickFromDataValue) {
    const extendedMaxIndex = getTickIndex({
      tick: extendedMaxTick,
      floorTick: floorPriceDecimal,
      tickSize: tickSizeDecimal,
    })
    windowMaxIndex = Math.max(windowMaxIndex, extendedMaxIndex)
  }

  const windowMinTick = getTickFromIndex({
    index: windowMinIndex,
    floorTick: floorPriceDecimal,
    tickSize: tickSizeDecimal,
  })
  const windowMaxTick = getTickFromIndex({
    index: windowMaxIndex,
    floorTick: floorPriceDecimal,
    tickSize: tickSizeDecimal,
  })

  const effectiveEntries = entries.filter((entry) => entry.tick >= windowMinTick && entry.tick <= windowMaxTick)

  // Calculate excluded volume in display units (USD or bid token amount)
  const excludedVolumeNumber = excludedVolume
    ? toDecimal(excludedVolume, bidTokenInfo.decimals) * (bidTokenInfo.priceFiat > 0 ? bidTokenInfo.priceFiat : 1)
    : 0

  // Calculate total bid volume from ALL entries (not just windowed ones) plus excluded volume
  const totalBidVolume = entries.reduce((sum, entry) => sum + entry.amount, 0) + excludedVolumeNumber

  if (effectiveEntries.length === 0) {
    // Use floorPrice as the anchor for the tick grid even when there are no bids
    const emptyMaxIndex = Math.max(minRequiredMaxIndex, CHART_CONSTRAINTS.MIN_BARS - 1)
    const emptyMaxTick = getTickFromIndex({
      index: emptyMaxIndex,
      floorTick: floorPriceDecimal,
      tickSize: tickSizeDecimal,
    })
    return {
      bars: [],
      yAxisLevels: [...DEFAULT_Y_AXIS_LEVELS],
      minTick: getTickFromIndex({
        index: Math.min(0, windowMinIndex),
        floorTick: floorPriceDecimal,
        tickSize: tickSizeDecimal,
      }),
      maxTick: emptyMaxTick,
      maxAmount: 0,
      totalBidVolume,
      concentration: null,
      maxTickFromData: maxTickFromDataValue,
    }
  }

  // Use floorPrice as tick grid anchor (at tick boundary). clearingPrice is for display only (may be between ticks)
  let minTick = windowMinTick
  if (effectiveEntries.length > 0 && effectiveEntries[0].tick < minTick) {
    minTick = effectiveEntries[0].tick
  }

  const maxTickInWindow = Math.max(windowMaxTick, effectiveEntries[effectiveEntries.length - 1].tick)
  const maxAmount = Math.max(...effectiveEntries.map((e) => e.amount))

  // Rule 3 & 6 & 7: Calculate bar step and range
  const { barStep, rangeMax, totalBars } = calculateBarStepAndRange({
    minTick,
    maxTick: maxTickInWindow,
    tickSize: tickSizeDecimal,
  })

  // Rule 4: Calculate label increment for 10 labels
  const labelIncrement = calculateLabelIncrement({
    minTick,
    rangeMax,
    tickSize: tickSizeDecimal,
  })

  // Build bars array - one bar per tick_size step
  const bars: ChartBarData[] = []
  // Store both amount and Q96 string for precise matching
  const bidLookup = new Map(effectiveEntries.map((e) => [e.tick, { amount: e.amount, tickQ96: e.tickQ96 }]))

  // Calculate base tick offset: how many ticks from floorPrice to minTick
  // This is needed to correctly calculate Q96 for ticks that don't have bid data
  const floorToMinOffset = Math.round((minTick - floorPriceDecimal) / tickSizeDecimal)

  for (let i = 0; i < totalBars; i++) {
    const currentTick = minTick + i * barStep

    // Find exact match or very close match (within small tolerance for floating point)
    const tolerance = barStep * TOLERANCE.TICK_COMPARISON
    let matchedEntry = bidLookup.get(currentTick)
    if (!matchedEntry) {
      // Check for near matches
      for (const [tick, data] of bidLookup.entries()) {
        if (Math.abs(tick - currentTick) < tolerance) {
          matchedEntry = data
          break
        }
      }
    }

    const displayValue = calculateTickDisplayValue({
      tickValue: currentTick,
      bidTokenInfo,
      totalSupply,
      auctionTokenDecimals,
    })

    // Use matched Q96 if available, otherwise calculate from floor price
    const tickQ96 =
      matchedEntry?.tickQ96 ??
      calculateTickQ96({
        basePriceQ96: floorPrice,
        tickSizeQ96: tickSize,
        tickOffset: floorToMinOffset + i,
      })

    bars.push({
      tick: currentTick,
      tickQ96,
      tickDisplay: formatter(displayValue),
      amount: matchedEntry?.amount ?? 0,
      index: i,
    })
  }

  // Apply cumulative sum transformation for demand chart mode
  // Use all entries (not just windowed bars) to ensure cumulative volumes include out-of-window bids
  const finalBars =
    chartMode === 'demand'
      ? computeCumulativeBarsFromEntries({
          bars,
          entries,
          tickSize: tickSizeDecimal,
          excludedVolumeAboveWindow: excludedVolumeNumber,
        })
      : bars

  // Recalculate maxAmount after transformation (for Y-axis scaling)
  const finalMaxAmount = chartMode === 'demand' ? Math.max(...finalBars.map((b) => b.amount), 0) : maxAmount

  const yAxisLevels = calculateYAxisLevels(finalMaxAmount)

  // Calculate bid concentration (only for bids at or above clearing price)
  // Note: For demand mode, concentration is not shown, but we still compute it
  // for potential use in tooltips or other features
  const concentration = calculateBidConcentration({
    bars: bars.map((bar) => ({
      tick: bar.tick,
      tickQ96: bar.tickQ96,
      amount: bar.amount,
      index: bar.index,
    })),
    clearingPrice: clearingPriceDecimal,
  })

  return {
    bars: finalBars,
    yAxisLevels,
    minTick,
    maxTick: rangeMax,
    maxAmount: finalMaxAmount,
    totalBidVolume,
    labelIncrement,
    concentration,
    maxTickFromData: maxTickFromDataValue,
  }
}

/**
 * Calculate initial visible range for zoom functionality
 * Shows clearing price (or minTick) at the left edge, plus INITIAL_TICK_COUNT ticks to the right
 *
 * @param params - Parameters including clearing price, tick size, and data range
 * @returns Initial visible range in tick values { from, to }
 */
export function calculateInitialVisibleRange(params: {
  clearingPrice: number
  minTick: number
  maxTick: number
  tickSize: number
  initialTickCount?: number
}): { from: number; to: number } {
  const { clearingPrice, minTick, tickSize, initialTickCount = 20 } = params

  const maxTick = params.maxTick

  // If clearing price is outside the data range, anchor the initial view to the data itself.
  // Setting a visible range that contains *no data points* can cause lightweight-charts to throw
  // internally during visible-range recalculations (we've seen "Value is null").
  const canAnchorToClearingPrice =
    Number.isFinite(clearingPrice) &&
    Number.isFinite(minTick) &&
    Number.isFinite(maxTick) &&
    clearingPrice >= minTick &&
    clearingPrice <= maxTick

  const anchorTick = canAnchorToClearingPrice ? clearingPrice : minTick

  // Start one tick before the anchor when possible to provide padding on initial render.
  const safeTickSize = Number.isFinite(tickSize) && tickSize > 0 ? tickSize : 0
  const startTick = safeTickSize > 0 ? Math.max(minTick, anchorTick - safeTickSize) : minTick

  // Calculate end tick by adding initialTickCount ticks and clamp to the available data range
  const endTick = safeTickSize > 0 ? startTick + initialTickCount * safeTickSize : maxTick
  const clampedEndTick = Number.isFinite(maxTick) ? Math.min(maxTick, endTick) : endTick

  // Ensure a non-zero range (required by lightweight-charts). If maxTick is too close, allow a minimal
  // window above startTick so the range still intersects the data.
  const minWindow = safeTickSize > 0 ? safeTickSize : 1
  const to = clampedEndTick > startTick ? clampedEndTick : startTick + minWindow

  return { from: startTick, to }
}

/**
 * Calculate padded range around a concentration window.
 */
export function getPaddedConcentrationRange(params: {
  startTick: number
  endTick: number
  minTick: number
  maxTick: number
  tickSizeDecimal: number
  beforePercentOfFullRange: number
  afterPercentOfFullRange: number
  minPadTicks: number
}): { from: number; to: number } {
  const {
    startTick,
    endTick,
    minTick,
    maxTick,
    tickSizeDecimal,
    beforePercentOfFullRange,
    afterPercentOfFullRange,
    minPadTicks,
  } = params

  // Full range expressed as ticks, clamped to at least 1 to keep padding sane.
  const fullTickCount = Math.max(1, Math.round((maxTick - minTick) / tickSizeDecimal))
  const padBeforeTicks = Math.max(minPadTicks, Math.round(fullTickCount * beforePercentOfFullRange))
  const padAfterTicks = Math.max(minPadTicks, Math.round(fullTickCount * afterPercentOfFullRange))

  const paddedFrom = startTick - padBeforeTicks * tickSizeDecimal
  const paddedTo = endTick + padAfterTicks * tickSizeDecimal

  return {
    from: Math.max(minTick, paddedFrom),
    to: Math.min(maxTick, paddedTo),
  }
}

/**
 * Calculate label increment dynamically based on current visible range
 * Reuses the existing calculateLabelIncrement logic but applies it to the visible range
 * @param targetMaxLabels - Optional target max labels for responsive layouts (smaller screens use fewer labels)
 */
export function calculateDynamicLabelIncrement(params: {
  visibleFrom: number
  visibleTo: number
  tickSize: number
  targetMaxLabels?: number
}): number {
  const { visibleFrom, visibleTo, tickSize, targetMaxLabels } = params

  // Use the existing label increment calculation logic
  return calculateLabelIncrement({
    minTick: visibleFrom,
    rangeMax: visibleTo,
    tickSize,
    targetMaxLabels,
  })
}
