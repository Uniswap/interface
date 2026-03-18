// These types are used in the gas estimation improvement experiment.
// They are internal to uniswap, so they are not declared in the Trading API public definition.
// Once the experiment is complete, we can remove them easily or add them to the public API definition.

import type { FetchError } from '@universe/api/src/clients/base/errors'

export enum FeeType {
  LEGACY = 'legacy',
  EIP1559 = 'eip1559',
}

export interface GasStrategy {
  limitInflationFactor: number
  displayLimitInflationFactor: number
  priceInflationFactor: number
  percentileThresholdFor1559Fee: number
  thresholdToInflateLastBlockBaseFee?: number | null
  baseFeeMultiplier?: number | null
  baseFeeHistoryWindow?: number | null
  minPriorityFeeRatioOfBaseFee?: number | null
  minPriorityFeeGwei?: number | null
  maxPriorityFeeGwei?: number | null
}

export type TransactionLegacyFeeParams = {
  gasPrice: string
  gasLimit: string
}

export type TransactionEip1559FeeParams = {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
}

export interface GasEstimateLegacy extends TransactionLegacyFeeParams {
  type: FeeType.LEGACY
  strategy: GasStrategy
  gasFee: string
}

export interface GasEstimateEip1559 extends TransactionEip1559FeeParams {
  type: FeeType.EIP1559
  strategy: GasStrategy
  gasFee: string
}

export type GasEstimate = GasEstimateLegacy | GasEstimateEip1559

// GasFeeResponse is the type that comes directly from the Gas Service API
export type GasFeeResponse = {
  gasEstimates: GasEstimate[]
}

export type FormattedUniswapXGasFeeInfo = {
  approvalFeeFormatted?: string
  swapFeeFormatted: string
  preSavingsGasFeeFormatted: string
  inputTokenSymbol?: string
}

export type GasFeeResult = {
  value?: string
  displayValue?: string
  isLoading: boolean
  error: FetchError | Error | null
  params?: TransactionLegacyFeeParams | TransactionEip1559FeeParams
  gasEstimate?: GasEstimate
}

// TODO(WALL-6421): Remove this type once GasFeeResult shape is decoupled from state fields
export type GasFeeResultWithoutState = Omit<GasFeeResult, 'isLoading' | 'error'>
