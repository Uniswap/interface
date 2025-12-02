import {
  CHART_CONSTRAINTS,
  DEFAULT_Y_AXIS_LEVELS,
  LABEL_GENERATION,
  NICE_VALUES,
  TOLERANCE,
} from 'components/Toucan/Auction/BidDistributionChart/constants'
import {
  BidConcentrationResult,
  calculateBidConcentration,
} from 'components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import { BidDistributionData, BidTokenInfo, DisplayMode } from 'components/Toucan/Auction/store/types'
import { formatUnits } from 'viem'

/**
 * Represents a single bar in the distribution chart
 */
// eslint-disable-next-line import/no-unused-modules
export interface ChartBarData {
  tick: number // Tick value in smallest unit
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
  labelIncrement?: number
  concentration: BidConcentrationResult | null
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
 * Labels align with tick_size boundaries and aim for 7-12 total labels
 * Prefers "nice" round numbers (multiples of 1, 2, 5, 10, 20, 50, 100, etc.)
 * Dynamically handles any range size from tiny to extreme
 */
function calculateLabelIncrement(params: { minTick: number; rangeMax: number; tickSize: number }): number {
  const { minTick, rangeMax, tickSize } = params
  const range = rangeMax - minTick

  // Calculate theoretical multiplier bounds to achieve target label count
  // minMultiplier produces MAX_LABELS, maxMultiplier produces MIN_LABELS
  const minMultiplier = Math.max(1, Math.ceil(range / (LABEL_GENERATION.MAX_LABELS * tickSize)))
  const maxMultiplier = Math.max(1, Math.floor(range / (LABEL_GENERATION.MIN_LABELS * tickSize)))

  // Generate candidates dynamically based on the actual range
  const candidates = generateDynamicCandidates({ minMultiplier, maxMultiplier })

  let bestMultiplier = 0
  let bestScore = Infinity

  // Evaluate all candidates
  for (const multiplier of candidates) {
    const labelIncrement = multiplier * tickSize
    const numLabels = Math.floor(range / labelIncrement) + 1

    // Skip if outside acceptable range
    if (numLabels < LABEL_GENERATION.MIN_LABELS || numLabels > LABEL_GENERATION.MAX_LABELS) {
      continue
    }

    // Score based on: distance from ideal count + preference for nice round numbers
    const countDiff = Math.abs(numLabels - LABEL_GENERATION.IDEAL_LABELS)
    const roundnessBonus = isNiceMultiplier(multiplier) ? -2 : 0
    const score = countDiff + roundnessBonus

    if (score < bestScore) {
      bestScore = score
      bestMultiplier = multiplier
    }
  }

  // Fallback: if no candidate produces 7-12 labels, calculate the ideal multiplier
  if (bestMultiplier === 0) {
    const idealMultiplier = Math.max(1, Math.ceil(range / (LABEL_GENERATION.IDEAL_LABELS * tickSize)))
    bestMultiplier = roundToNiceNumber(idealMultiplier)

    // Validate the fallback produces acceptable label count
    const fallbackLabelCount = Math.floor(range / (bestMultiplier * tickSize)) + 1

    // If still outside range, relax to nearest boundary
    if (fallbackLabelCount < LABEL_GENERATION.MIN_LABELS) {
      // Too few labels - reduce multiplier to increase label count
      bestMultiplier = Math.max(1, Math.floor(range / ((LABEL_GENERATION.MIN_LABELS - 1) * tickSize)))
    } else if (fallbackLabelCount > LABEL_GENERATION.MAX_LABELS) {
      // Too many labels - increase multiplier to decrease label count
      bestMultiplier = Math.max(1, Math.ceil(range / ((LABEL_GENERATION.MAX_LABELS + 1) * tickSize)))
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
  displayMode: DisplayMode
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
}): number {
  const { tickValue, displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals = 18 } = params
  // Convert tick value to USD (tick is already in bid token units, multiply by price)
  const tickInUSD = tickValue * bidTokenInfo.priceFiat

  if (displayMode === DisplayMode.TOKEN_PRICE) {
    // Show as token price in USD
    return tickInUSD
  } else {
    // Valuation mode: multiply by total supply to get FDV
    if (!totalSupply) {
      return tickInUSD
    }

    // Convert totalSupply to decimal tokens using the auction token decimals
    const totalTokens = toDecimal(totalSupply, auctionTokenDecimals)
    return tickInUSD * totalTokens
  }
}

/**
 * Format tick value for display (exported for chart component)
 * Uses provided formatter function for localized formatting
 */
export function formatTickForDisplay(params: {
  tickValue: number
  displayMode: DisplayMode
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
 * Generate chart data from raw bid distribution data
 */
export function generateChartData(params: {
  bidData: BidDistributionData
  bidTokenInfo: BidTokenInfo
  displayMode: DisplayMode
  totalSupply?: string
  auctionTokenDecimals?: number
  clearingPrice: string
  tickSize: string
  formatter: (amount: number) => string
}): ProcessedChartData {
  const {
    bidData,
    bidTokenInfo,
    displayMode,
    totalSupply,
    auctionTokenDecimals = 18,
    clearingPrice,
    tickSize,
    formatter,
  } = params

  // Convert tick_size to decimal
  const tickSizeDecimal = toDecimal(tickSize, bidTokenInfo.decimals)

  // Convert map entries to sorted array using BigInt-safe conversion
  const entries = Array.from(bidData.entries())
    .map(([tick, amount]) => ({
      tick: toDecimal(tick, bidTokenInfo.decimals),
      amount: toDecimal(amount, bidTokenInfo.decimals) * bidTokenInfo.priceFiat, // Convert to USD
    }))
    .sort((a, b) => a.tick - b.tick)

  if (entries.length === 0) {
    // Derive maxTick from tickSize: maxTick = minTick + (MIN_BARS - 1) * tickSize ensures exactly 20 bars
    const emptyMaxTick = (CHART_CONSTRAINTS.MIN_BARS - 1) * tickSizeDecimal

    return {
      bars: [],
      yAxisLevels: [...DEFAULT_Y_AXIS_LEVELS],
      minTick: 0,
      maxTick: emptyMaxTick,
      maxAmount: 0,
      concentration: null,
    }
  }

  // Convert clearingPrice to decimal
  const clearingPriceDecimal = toDecimal(clearingPrice, bidTokenInfo.decimals)

  // Rule 1 & 5: Use clearingPrice as minTick if it's lower than the lowest bid tick
  let minTick = entries[0].tick
  if (clearingPriceDecimal < minTick) {
    minTick = clearingPriceDecimal
  }

  const maxTickFromData = entries[entries.length - 1].tick
  const maxAmount = Math.max(...entries.map((e) => e.amount))

  // Rule 3 & 6 & 7: Calculate bar step and range
  const { barStep, rangeMax, totalBars } = calculateBarStepAndRange({
    minTick,
    maxTick: maxTickFromData,
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
  const bidLookup = new Map(entries.map((e) => [e.tick, e.amount]))

  for (let i = 0; i < totalBars; i++) {
    const currentTick = minTick + i * barStep

    // Find exact match or very close match (within small tolerance for floating point)
    const tolerance = barStep * TOLERANCE.TICK_COMPARISON
    let matchedEntry = bidLookup.get(currentTick)
    if (!matchedEntry) {
      // Check for near matches
      for (const [tick, amount] of bidLookup.entries()) {
        if (Math.abs(tick - currentTick) < tolerance) {
          matchedEntry = amount
          break
        }
      }
    }

    const displayValue = calculateTickDisplayValue({
      tickValue: currentTick,
      displayMode,
      bidTokenInfo,
      totalSupply,
      auctionTokenDecimals,
    })

    bars.push({
      tick: currentTick,
      tickDisplay: formatter(displayValue),
      amount: matchedEntry ?? 0,
      index: i,
    })
  }

  const yAxisLevels = calculateYAxisLevels(maxAmount)

  // Calculate bid concentration (only for bids at or above clearing price)
  const concentration = calculateBidConcentration({
    bars: bars.map((bar) => ({
      tick: bar.tick,
      amount: bar.amount,
      index: bar.index,
    })),
    clearingPrice: clearingPriceDecimal,
  })

  return {
    bars,
    yAxisLevels,
    minTick,
    maxTick: rangeMax,
    maxAmount,
    labelIncrement, // Export for chart component to use
    concentration,
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
  const { clearingPrice, tickSize, initialTickCount = 20 } = params

  // Start from clearing price
  const startTick = clearingPrice

  // Calculate end tick by adding initialTickCount ticks
  const endTick = startTick + initialTickCount * tickSize

  // Make sure we don't exceed maxTick (but allow exceeding if needed to show initial count)
  // The chart will handle empty bars beyond the data range
  const finalEndTick = endTick

  return {
    from: startTick,
    to: Math.max(finalEndTick, startTick + tickSize), // Ensure at least one tick is shown
  }
}

/**
 * Calculate label increment dynamically based on current visible range
 * Reuses the existing calculateLabelIncrement logic but applies it to the visible range
 */
export function calculateDynamicLabelIncrement(params: {
  visibleFrom: number
  visibleTo: number
  tickSize: number
}): number {
  const { visibleFrom, visibleTo, tickSize } = params

  // Use the existing label increment calculation logic
  return calculateLabelIncrement({
    minTick: visibleFrom,
    rangeMax: visibleTo,
    tickSize,
  })
}
