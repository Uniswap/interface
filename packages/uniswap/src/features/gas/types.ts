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

  // displayLimitInflationFactor is not returned by the server, so it's ignored here
  return (
    a.limitInflationFactor === b.limitInflationFactor &&
    a.priceInflationFactor === b.priceInflationFactor &&
    a.percentileThresholdFor1559Fee === b.percentileThresholdFor1559Fee &&
    a.minPriorityFeeGwei === b.minPriorityFeeGwei &&
    a.maxPriorityFeeGwei === b.maxPriorityFeeGwei
  )
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
