import { SerializedError } from '@reduxjs/toolkit'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'

export enum GasSpeed {
  Normal = 'normal',
  Fast = 'fast',
  Urgent = 'urgent',
}

export enum FeeType {
  Legacy = 'legacy',
  Eip1559 = 'eip1559',
}

interface GasFeeResponseBase {
  type: FeeType
  gasLimit: string
  gasFee: {
    normal: string
    fast: string
    urgent: string
  }
}

interface GasFeeResponseEip1559 extends GasFeeResponseBase {
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

export type TransactionLegacyFeeParams = {
  gasPrice: string
  gasLimit: string
}

export type TransactionEip1559FeeParams = {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
}

// GasFeeResponse is the type that comes directly from the Gas Service API
export type GasFeeResponse = GasFeeResponseEip1559 | GasFeeResponseLegacy

export type GasFeeResult = {
  value?: string
  isLoading: boolean
  error: SerializedError | FetchError | Error | null
  params?: TransactionLegacyFeeParams | TransactionEip1559FeeParams
}

export type FormattedUniswapXGasFeeInfo = {
  approvalFeeFormatted?: string
  wrapFeeFormatted?: string
  swapFeeFormatted: string
  preSavingsGasFeeFormatted: string
  inputTokenSymbol?: string
}
