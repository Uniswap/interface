import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SubmitTransactionParamsWithTypeInfo } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'

export interface BaseTransactionContext {
  chainId: number
  account: SignerMnemonicAccountMeta
  submitViaPrivateRpc: boolean
  userSubmissionTimestampMs: number
  timestampBeforeSign: number
  analytics: SwapTradeBaseProperties
}

export type TransactionExecutionResult =
  | {
      hash: string
      success: true
    }
  | {
      error: unknown
      success: false
    }

export type TransactionExecutionSyncResultSuccess = {
  transaction: TransactionDetails
  success: true
}

export type TransactionExecutionSyncResultError = {
  error: unknown
  success: false
}

export type TransactionExecutionSyncResult = TransactionExecutionSyncResultSuccess | TransactionExecutionSyncResultError

export enum TransactionStepType {
  Approval = 'approval',
  Permit = 'permit',
  Wrap = 'wrap',
  Swap = 'swap',
}

export interface TransactionStep {
  type: TransactionStepType
  params: SubmitTransactionParamsWithTypeInfo
  shouldWait?: boolean
}
