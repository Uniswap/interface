import type { GasStrategy } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Normal speed strategy - Lower multipliers for economical transactions
export const NORMAL_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.1,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.1,
  percentileThresholdFor1559Fee: 50,
  thresholdToInflateLastBlockBaseFee: 0.9,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.1,
  minPriorityFeeGwei: 1,
  maxPriorityFeeGwei: 5,
}

// Fast speed strategy - Moderate multipliers for balanced speed/cost
export const FAST_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.12,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.25,
  percentileThresholdFor1559Fee: 60,
  thresholdToInflateLastBlockBaseFee: 0.8,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.15,
  minPriorityFeeGwei: 1.5,
  maxPriorityFeeGwei: 7,
}

// Urgent speed strategy - Higher multipliers for fast confirmation
export const URGENT_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
  thresholdToInflateLastBlockBaseFee: 0.75,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.2,
  minPriorityFeeGwei: 2,
  maxPriorityFeeGwei: 9,
}

// The default "Urgent" strategy that was previously hardcoded in the gas service
export const DEFAULT_GAS_STRATEGY: GasStrategy = URGENT_GAS_STRATEGY

// Per-chain gas strategy field overrides. Merged on top of the resolved strategy.
export const CHAIN_GAS_STRATEGY_OVERRIDES: Record<number, Partial<GasStrategy>> = {
  // https://docs.arbitrum.io/learn-more/faq#do-i-need-to-pay-a-tip-or-priority-fee-for-my-arbitrum-transactions
  [UniverseChainId.ArbitrumOne]: {
    minPriorityFeeGwei: 0,
    maxPriorityFeeGwei: 0,
  },
  // https://docs.zksync.io/zksync-protocol/era-vm/transactions/transaction-lifecycle#eip-1559-0x2
  [UniverseChainId.Zksync]: {
    minPriorityFeeGwei: 0,
    maxPriorityFeeGwei: 0,
  },
}
