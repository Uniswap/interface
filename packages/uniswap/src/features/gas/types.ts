import { SerializedError } from '@reduxjs/toolkit'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { GasEstimate, GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'

export type TransactionLegacyFeeParams = {
  gasPrice: string
  gasLimit: string
}

export type TransactionEip1559FeeParams = {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
}

export function areEqualGasStrategies(a?: GasStrategy, b?: GasStrategy): boolean {
  if (!a || !b) {
    return false
  }

  const optionalFieldMatch = <T>(fieldA: T | undefined | null, fieldB: T | undefined | null): boolean => {
    return fieldA == null || fieldB == null || fieldA === fieldB
  }

  // Required fields must be exactly equal
  const requiredFieldsEqual =
    a.limitInflationFactor === b.limitInflationFactor &&
    a.priceInflationFactor === b.priceInflationFactor &&
    a.percentileThresholdFor1559Fee === b.percentileThresholdFor1559Fee

  // Optional fields can be undefined on either side or equal if both defined
  const optionalFieldsMatch =
    optionalFieldMatch(a.thresholdToInflateLastBlockBaseFee, b.thresholdToInflateLastBlockBaseFee) &&
    optionalFieldMatch(a.baseFeeMultiplier, b.baseFeeMultiplier) &&
    optionalFieldMatch(a.baseFeeHistoryWindow, b.baseFeeHistoryWindow) &&
    optionalFieldMatch(a.minPriorityFeeRatioOfBaseFee, b.minPriorityFeeRatioOfBaseFee) &&
    optionalFieldMatch(a.minPriorityFeeGwei, b.minPriorityFeeGwei) &&
    optionalFieldMatch(a.maxPriorityFeeGwei, b.maxPriorityFeeGwei)

  // displayLimitInflationFactor is not returned by the server, so it's ignored here
  return requiredFieldsEqual && optionalFieldsMatch
}

export function getGasPrice(estimate: GasEstimate): string {
  return 'gasPrice' in estimate ? estimate.gasPrice : estimate.maxFeePerGas
}

// GasFeeResponse is the type that comes directly from the Gas Service API
export type GasFeeResponse = {
  gasEstimates: GasEstimate[]
}

export type GasFeeResult = {
  value?: string
  displayValue?: string
  isLoading: boolean
  error: SerializedError | FetchError | Error | null
  params?: TransactionLegacyFeeParams | TransactionEip1559FeeParams
  gasEstimates?: GasFeeEstimates
}

export type ValidatedGasFeeResult = GasFeeResult & { value: string; error: null }
export function validateGasFeeResult(gasFee: GasFeeResult): ValidatedGasFeeResult | undefined {
  if (gasFee.value === undefined || gasFee.error) {
    return undefined
  }
  return { ...gasFee, value: gasFee.value, error: null }
}

export type FormattedUniswapXGasFeeInfo = {
  approvalFeeFormatted?: string
  wrapFeeFormatted?: string
  swapFeeFormatted: string
  preSavingsGasFeeFormatted: string
  inputTokenSymbol?: string
}
