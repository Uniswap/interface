import type { BigNumber } from 'ethers'

export enum GasSpeed {
  Normal = 'normal',
  Fast = 'fast',
  Urgent = 'urgent',
}

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

interface GasFeeResponseBase {
  type: FeeType
  gasLimit: string
  gasFee: {
    normal: string
    fast: string
    urgent: string
  }
}

interface GasFeeReponseEip1559 extends GasFeeResponseBase {
  type: FeeType.Eip1559
  maxFeePerGas: {
    normal: string
    fast: string
    urgent: string
  }
  maxPriorityFeePerGas: {
    normal: string
    fast: string
    urgent: string
  }
}

interface GasFeeResponseLegacy extends GasFeeResponseBase {
  type: FeeType.Legacy
  gasPrice: {
    normal: string
    fast: string
    urgent: string
  }
}

type TransactionLegacyFeeParams = {
  gasPrice: string
  gasLimit: string
}

type TransactionEip1559FeeParams = {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
}

// GasFeeResponse is the type that comes directly from the Gas Service API
export type GasFeeResponse = GasFeeReponseEip1559 | GasFeeResponseLegacy

// TransactionGasFeeInfo is the transformed response that is readily usable
// by components
export type TransactionGasFeeInfo = {
  type: FeeType
  speed: GasSpeed

  // gasFee is the total network fee denoted in wei of the native currency
  // this is the value to be converted into USD and shown to the user
  gasFee: string

  // these are the values corresponding to gasFee that are eventually
  // passed to the transaction itself
  params: TransactionLegacyFeeParams | TransactionEip1559FeeParams
}
