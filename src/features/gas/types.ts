import type { BigNumber } from 'ethers'

/**
 * Common fee related types
 */

export enum FeeType {
  Legacy = 'legacy',
  Eip1559 = 'eip1559',
}

export interface FeeInfoBase {
  type: FeeType
  gasLimit: string // Amount of gas (i.e. from estimateGas call)
  fee: { normal: string; fast: string; urgent: string } // Suggested costs for fee (price * gas)
}

export interface FeeInfoLegacy extends FeeInfoBase {
  type: FeeType.Legacy
  gasPrice: string
}

export interface FeeInfo1559 extends FeeInfoBase {
  type: FeeType.Eip1559
  feeDetails: {
    currentBaseFeePerGas: string
    maxBaseFeePerGas: string
    maxPriorityFeePerGas: { normal: string; fast: string; urgent: string }
  }
}

export type FeeInfo = FeeInfo1559 | FeeInfoLegacy

/**
 * EIP-1559 related types based on fee-suggestions lib from
 * https://github.com/rainbow-me/fee-suggestions
 */

export type BlockReward = string[]
export type GasUsedRatio = number[]

/**
 * Response interface from `eth_feeHistory` RPC call
 * @member baseFeePerGas - Array containing base fee per gas of the last BLOCKCOUNT blocks
 * @member gasUsedRatio - Array containing gas used ratio of the last BLOCKCOUNT blocks
 * @member oldestBlock - Lowest number block of the result range
 * @member reward - Array of effective priority fee per gas data points from a single block
 */
export interface FeeHistoryResponse {
  baseFeePerGas: string[]
  gasUsedRatio: GasUsedRatio
  oldestBlock: number
  reward?: BlockReward[]
}

/**
 * Max base fee related suggestions
 * @member maxBaseFeeSuggestion - Base fee suggestion in wei string
 * @member baseFeeTrend - Estimated trend
 * @member currentBaseFee - Current block base fee in wei string
 */
export interface MaxFeeSuggestions {
  currentBaseFee: BigNumber
  baseFeeSuggestion: BigNumber
  baseFeeTrend: number
}

/**
 * Max fee priority fee related suggestions
 * @member maxPriorityFeeSuggestions - Max priority fee in wei string per speeds, `urgent`, `fast` and `normal`
 * @member confirmationSecondsToPriorityFee - Estimated seconds that a confirmation will need
 */
export interface MaxPriorityFeeSuggestions {
  priorityFeeSuggestions: { normal: BigNumber; fast: BigNumber; urgent: BigNumber }
  confirmationSecondsToPriorityFee: {
    15: BigNumber
    30: BigNumber
    45: BigNumber
    60: BigNumber
  }
}

export interface FeePerGasSuggestions extends MaxFeeSuggestions, MaxPriorityFeeSuggestions {}
