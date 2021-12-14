// Base on updated baseFeeTrend calculation from:
// https://github.com/rainbow-me/fee-suggestions/pull/17/files#diff-39b2554fd18da165b59a6351b1aafff3714e2a80c1435f2de9706355b4d32351R177

import { BigNumber } from 'ethers'
import { logger } from 'src/utils/logger'
import { linearRegression } from 'src/utils/statistics'
import { weiToGwei } from 'src/utils/wei'

const THRESHOLDS = {
  FALLING: 0.725,
  RAISING: 1.275,
  SURGING: 1.5,
  MEDIAN_SLOPE: -5,
}

export enum BaseFeeTrend {
  Falling = -1,
  Holding = 0,
  Raising = 1,
  Surging = 2,
}

/**
 * Computes the trend (e.g. rising/falling) of the base fee by looking at fee history
 * @param baseFees fees from previous blocks in ascending order (lowest block first). Recommend at least ~20 for meaningful stats
 * @param currentBaseFee the base fee from the latest block
 * @returns BaseFeeTrend
 */
export function computeBaseFeeTrend(baseFees: number[], currentBaseFee: BigNumber): BaseFeeTrend {
  try {
    const subsetSize = Math.floor(baseFees.length / 4)
    const feeStats = getStatsForSubsets(baseFees, subsetSize)
    const maxByMedian = feeStats.max / feeStats.median
    const minByMedian = feeStats.min / feeStats.median

    if (maxByMedian > THRESHOLDS.SURGING) {
      return BaseFeeTrend.Surging
    } else if (maxByMedian > THRESHOLDS.RAISING && minByMedian > THRESHOLDS.FALLING) {
      return BaseFeeTrend.Raising
    } else if (maxByMedian < THRESHOLDS.RAISING && minByMedian > THRESHOLDS.FALLING) {
      // In this case, check the median slope of a smaller subset
      const baseFeesNewerHalf = baseFees.splice(baseFees.length / 2)
      const subsetSizeNewerHalf = Math.floor(baseFeesNewerHalf.length / 10)
      const feeStatsNewerHalf = getStatsForSubsets(baseFeesNewerHalf, subsetSizeNewerHalf)
      if (feeStatsNewerHalf.medianSlope < THRESHOLDS.MEDIAN_SLOPE) {
        return BaseFeeTrend.Falling
      } else {
        return BaseFeeTrend.Holding
      }
      // If max and mix are both less then thresholds
    } else if (maxByMedian < THRESHOLDS.RAISING && minByMedian < THRESHOLDS.FALLING) {
      return BaseFeeTrend.Falling
      // If no max and min values fall in the threshold, see if current is more than median
    } else if (weiToGwei(currentBaseFee) > feeStats.median) {
      return BaseFeeTrend.Raising
      // Otherwise assume falling
    } else {
      return BaseFeeTrend.Falling
    }
  } catch (e) {
    logger.warn('computeBaseFeeTrend', '', 'Error when computing', e)
    return BaseFeeTrend.Holding
  }
}

function getStatsForSubsets(values: number[], subsetSize: number) {
  const subsets = createSubsets(values, subsetSize)
  const subsetsInfo = subsets.map((subset) => computeGroupStats(subset))
  const { max: lastMax, min: lastMin, median: lastMedian } = subsetsInfo[subsetsInfo.length - 1]
  const medianData = subsetsInfo.map((data) => data.median)
  const medianSlope = linearRegression(medianData)

  return {
    max: lastMax,
    min: lastMin,
    median: lastMedian,
    medianSlope,
  }
}

function createSubsets(values: number[], subsetSize: number) {
  const subsets = []
  for (let i = 0; i < values.length; i = i + subsetSize) {
    subsets.push(values.slice(i, i + subsetSize))
  }
  return subsets
}

function computeGroupStats(baseFees: number[]) {
  if (!baseFees || !baseFees.length) throw new Error('Cannot compute stats on empty list')
  const sortedBaseFees = baseFees.sort((a, b) => a - b)
  const min = sortedBaseFees[0]
  const max = sortedBaseFees.at(-1)!
  const median = sortedBaseFees[Math.floor(sortedBaseFees.length / 2)]
  return { max, median, min }
}
