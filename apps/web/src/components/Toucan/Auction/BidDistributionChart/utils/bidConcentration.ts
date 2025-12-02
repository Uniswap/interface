/**
 * Utility functions for calculating bid concentration bands
 */

export interface BidConcentrationResult {
  startTick: number // Starting tick value
  endTick: number // Ending tick value
  startIndex: number // Starting bar index in original bars array
  endIndex: number // Ending bar index in original bars array (inclusive)
  percentage: number // Percentage of total volume (0-1)
}

interface BarWithVolume {
  tick: number
  amount: number
  index: number
}

interface BidConcentrationOptions {
  bars: BarWithVolume[]
  clearingPrice: number
  targetPercentage?: number
  minClusterSize?: number
}

/**
 * Calculate bid concentration: find the largest sequential cluster of bars
 * that contains approximately 80% of the total bid volume.
 * Only considers bids at or above the clearing price.
 *
 * @param options - Configuration options
 * @param options.bars - Array of bars with tick, amount, and index
 * @param options.clearingPrice - Clearing price (only bars >= this price are considered)
 * @param options.targetPercentage - Target percentage of total volume (default 0.8 for 80%)
 * @param options.minClusterSize - Minimum number of bars required to show concentration (default 3)
 * @returns Concentration band info or null if no suitable cluster found
 */
export function calculateBidConcentration({
  bars,
  clearingPrice,
  targetPercentage = 0.8,
  minClusterSize = 3,
}: BidConcentrationOptions): BidConcentrationResult | null {
  // Filter out bars with zero amount AND bars below clearing price
  // IMPORTANT: Keep original indices intact for renderer to use
  const eligibleBars = bars.filter((bar) => {
    if (bar.amount === 0) {
      return false
    }
    // Only include bars at or above clearing price
    if (bar.tick < clearingPrice) {
      return false
    }
    return true
  })

  if (eligibleBars.length < minClusterSize) {
    return null
  }

  // Calculate total volume (sum of all bid amounts in fiat)
  const totalVolume = eligibleBars.reduce((sum, bar) => sum + bar.amount, 0)

  if (totalVolume === 0) {
    return null
  }

  const targetVolume = totalVolume * targetPercentage

  // Try to find the smallest sequential window that captures >= targetVolume
  let bestCluster: BidConcentrationResult | null = null
  let bestClusterSize = Infinity

  // Sliding window approach: for each starting position, expand window until we reach target
  for (let start = 0; start < eligibleBars.length; start++) {
    let windowVolume = 0
    for (let end = start; end < eligibleBars.length; end++) {
      windowVolume += eligibleBars[end].amount

      // If we've reached or exceeded the target volume
      if (windowVolume >= targetVolume) {
        const clusterSize = end - start + 1

        // Track the smallest cluster that meets the target
        if (clusterSize < bestClusterSize && clusterSize >= minClusterSize) {
          bestClusterSize = clusterSize
          bestCluster = {
            startTick: eligibleBars[start].tick,
            endTick: eligibleBars[end].tick,
            // Use original bar.index from the full bars array, not the filtered array index
            startIndex: eligibleBars[start].index,
            endIndex: eligibleBars[end].index,
            percentage: windowVolume / totalVolume,
          }
        }
        break // Move to next starting position
      }
    }
  }

  return bestCluster
}
