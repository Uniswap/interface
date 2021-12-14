// Based on the fee-suggestions library from https://github.com/rainbow-me/fee-suggestions
// Which was based on https://github.com/zsfelfoldi/feehistory

import { BigNumber, providers } from 'ethers'
import {
  GWEI_REWARD_OUTLIER_THRESHOLD,
  MAX_GWEI_FAST_PRI_FEE,
  MAX_GWEI_NORMAL_PRI_FEE,
  MAX_GWEI_URGENT_PRI_FEE,
  MAX_TIME_FACTOR,
  MIN_GWEI_FAST_PRI_FEE,
  MIN_GWEI_NORMAL_PRI_FEE,
  MIN_GWEI_URGENT_PRI_FEE,
  SAMPLE_MAX_PERCENTILE,
  SAMPLE_MIN_PERCENTILE,
  SUGGESTED_MAX_FEE_MULTIPLIER,
} from 'src/constants/gas'
import { computeBaseFeeTrend } from 'src/features/gas/computeBaseFeeTrend'
import {
  BlockReward,
  FeeHistoryResponse,
  FeePerGasSuggestions,
  MaxFeeSuggestions,
  MaxPriorityFeeSuggestions,
} from 'src/features/gas/types'
import { exponentialMovingAverage as ema, samplingCurve } from 'src/utils/statistics'
import { gweiToWei, weiToGwei } from 'src/utils/wei'

export async function suggestMaxBaseFee(
  provider: providers.JsonRpcProvider,
  fromBlock = 'latest',
  blockCountHistory = 100 // # blocks to fetch
): Promise<MaxFeeSuggestions> {
  // Retrieve fee history from chain in ascending block order starting at fromBlock
  const feeHistory: FeeHistoryResponse = await provider.send('eth_feeHistory', [
    blockCountHistory,
    fromBlock,
    [],
  ])

  const { baseFeePerGas, gasUsedRatio } = feeHistory || {}
  if (!baseFeePerGas?.length) throw new Error('Error: baseFeePerGas is empty')
  if (!gasUsedRatio?.length) throw new Error('Error: gasUsedRatio is empty')

  // Current fee is the last (latest) base fee
  const currentBaseFee = BigNumber.from(baseFeePerGas.at(-1))

  // Convert to gwei to simplify calculations
  const baseFees: number[] = []
  const order = []
  for (let i = 0; i < baseFeePerGas.length; i++) {
    baseFees.push(weiToGwei(baseFeePerGas[i]))
    order.push(i)
  }

  const baseFeeTrend = computeBaseFeeTrend(baseFees, currentBaseFee)

  // Slightly inflate base fee of last block
  baseFees[baseFees.length - 1] *= 9 / 8
  // Adjust baseFees for blocks that were almost full
  for (let i = gasUsedRatio.length - 1; i >= 0; i--) {
    if (gasUsedRatio[i] > 0.9) {
      baseFees[i] = baseFees[i + 1]
    }
  }

  // Sort baseFees in ascending order
  order.sort((a, b) => {
    if (baseFees[a] < baseFees[b]) return -1
    if (baseFees[a] > baseFees[b]) return 1
    return 0
  })

  const result = []
  let maxBaseFee = 0
  // Compute suggested base fees for each timeFactor
  for (let timeFactor = MAX_TIME_FACTOR; timeFactor >= 0; timeFactor--) {
    let baseFee = suggestBaseFee(
      baseFees,
      order,
      timeFactor,
      SAMPLE_MIN_PERCENTILE,
      SAMPLE_MAX_PERCENTILE
    )
    if (baseFee > maxBaseFee) {
      maxBaseFee = baseFee
    } else {
      baseFee = maxBaseFee
    }
    result[timeFactor] = baseFee
  }
  // Find max base fee of all suggestions
  const suggestedMaxBaseFee = Math.max(...result) * SUGGESTED_MAX_FEE_MULTIPLIER

  return {
    currentBaseFee: currentBaseFee,
    baseFeeSuggestion: gweiToWei(suggestedMaxBaseFee),
    baseFeeTrend,
  }
}

export async function suggestMaxPriorityFee(
  provider: providers.JsonRpcProvider,
  fromBlock = 'latest'
): Promise<MaxPriorityFeeSuggestions> {
  // Retrieve fee history (including rewards) from chain
  const feeHistory: FeeHistoryResponse = await provider.send('eth_feeHistory', [
    10,
    fromBlock,
    [10, 15, 30, 45],
  ])
  const blocksRewards = feeHistory?.reward
  if (!blocksRewards?.length) throw new Error('Error: blocksRewards is empty')

  // Find set of outlier (blocks with high rewards) to exclude
  const outlierBlocks = getOutlierBlocksToRemove(blocksRewards, 0)

  // Get reward data sets for different percentiles, while excluding outliers
  const blocksRewardsPercentile10 = rewardsFilterOutliers(blocksRewards, outlierBlocks, 0)
  const blocksRewardsPercentile15 = rewardsFilterOutliers(blocksRewards, outlierBlocks, 1)
  const blocksRewardsPercentile30 = rewardsFilterOutliers(blocksRewards, outlierBlocks, 2)
  const blocksRewardsPercentile45 = rewardsFilterOutliers(blocksRewards, outlierBlocks, 3)

  // Compute exponential moving averages for different percentiles
  const emaPercentile10 = ema(blocksRewardsPercentile10, blocksRewardsPercentile10.length).at(-1)
  const emaPercentile15 = ema(blocksRewardsPercentile15, blocksRewardsPercentile15.length).at(-1)
  const emaPercentile30 = ema(blocksRewardsPercentile30, blocksRewardsPercentile30.length).at(-1)
  const emaPercentile45 = ema(blocksRewardsPercentile45, blocksRewardsPercentile45.length).at(-1)

  if (
    emaPercentile10 === undefined ||
    emaPercentile15 === undefined ||
    emaPercentile30 === undefined ||
    emaPercentile45 === undefined
  ) {
    throw new Error('An ema percentile was undefined')
  }

  const boundedNormalPriorityFee = Math.min(
    Math.max(emaPercentile15, MIN_GWEI_NORMAL_PRI_FEE),
    MAX_GWEI_NORMAL_PRI_FEE
  )
  const boundedFastMaxPriorityFee = Math.min(
    Math.max(emaPercentile30, MIN_GWEI_FAST_PRI_FEE),
    MAX_GWEI_FAST_PRI_FEE
  )
  const boundedUrgentPriorityFee = Math.min(
    Math.max(emaPercentile45, MIN_GWEI_URGENT_PRI_FEE),
    MAX_GWEI_URGENT_PRI_FEE
  )

  return {
    priorityFeeSuggestions: {
      normal: gweiToWei(boundedNormalPriorityFee),
      fast: gweiToWei(boundedFastMaxPriorityFee),
      urgent: gweiToWei(boundedUrgentPriorityFee),
    },
    confirmationSecondsToPriorityFee: {
      15: gweiToWei(emaPercentile45),
      30: gweiToWei(emaPercentile30),
      45: gweiToWei(emaPercentile15),
      60: gweiToWei(emaPercentile10),
    },
  }
}

export async function suggestFees(
  provider: providers.JsonRpcProvider
): Promise<FeePerGasSuggestions> {
  // Get suggested max base fees
  const maxBasFeeP = suggestMaxBaseFee(provider)
  // Get suggested max priority fees (also known as miner 'tip', though not so accurate)
  const maxPriorityFeeP = suggestMaxPriorityFee(provider)
  const [maxBaseFee, maxPriorityFee] = await Promise.all([maxBasFeeP, maxPriorityFeeP])
  const { baseFeeSuggestion, baseFeeTrend, currentBaseFee } = maxBaseFee
  const { priorityFeeSuggestions, confirmationSecondsToPriorityFee } = maxPriorityFee
  return {
    baseFeeSuggestion,
    baseFeeTrend,
    currentBaseFee,
    priorityFeeSuggestions,
    confirmationSecondsToPriorityFee,
  }
}

const suggestBaseFee = (
  baseFee: number[],
  order: number[],
  timeFactor: number,
  sampleMin: number,
  sampleMax: number
) => {
  if (timeFactor < 1e-6) return baseFee[baseFee.length - 1]

  const pendingWeight =
    (1 - Math.exp(-1 / timeFactor)) / (1 - Math.exp(-baseFee.length / timeFactor))
  let sumWeight = 0
  let result = 0
  let samplingCurvePrev = 0
  for (const i of order) {
    sumWeight += pendingWeight * Math.exp((i - baseFee.length + 1) / timeFactor)
    const samplingCurveValue = samplingCurve(sumWeight, sampleMin, sampleMax)
    result += (samplingCurveValue - samplingCurvePrev) * baseFee[i]
    if (samplingCurveValue >= 1) return result
    samplingCurvePrev = samplingCurveValue
  }
  return result
}

function getOutlierBlocksToRemove(blocksRewards: BlockReward[], index: number) {
  const blocks: number[] = []
  blocksRewards
    .map((reward) => weiToGwei(reward[index]))
    .forEach((gweiReward, i) => {
      if (gweiReward > GWEI_REWARD_OUTLIER_THRESHOLD) {
        blocks.push(i)
      }
    })
  return blocks
}

function rewardsFilterOutliers(
  blocksRewards: BlockReward[],
  outlierBlocks: number[],
  rewardIndex: number
) {
  return blocksRewards
    .filter((_, index) => !outlierBlocks.includes(index))
    .map((reward) => weiToGwei(reward[rewardIndex]))
}
