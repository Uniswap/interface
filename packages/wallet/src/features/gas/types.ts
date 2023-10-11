import { ApolloError } from '@apollo/client'
import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/fetchBaseQuery'

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

// TransactionGasFeeInfo is the transformed response that is readily usable
// by components
export type TransactionGasFeeInfo = {
  type: FeeType
  speed: GasSpeed

  // gasFee.value is the total network fee denoted in wei of the native currency
  // this is the value to be converted into USD and shown to the user
  gasFee: GasFeeResult

  // these are the values corresponding to gasFee that are eventually
  // passed to the transaction itself
  params: TransactionLegacyFeeParams | TransactionEip1559FeeParams
}

export type UseTransactionGasFeeResponse = {
  data?: TransactionGasFeeInfo
  error?: ApolloError
}

export interface SimulatedGasEstimationInfo {
  loading: boolean
  simulatedGasLimit?: string
  quoteId?: string
  requestId?: string
  error?: boolean | FetchBaseQueryError | SerializedError
}

export type GasFeeResult = {
  value?: string
  loading: boolean
  error?: FetchBaseQueryError | SerializedError | ApolloError | string | boolean
  params?: TransactionLegacyFeeParams | TransactionEip1559FeeParams
}
