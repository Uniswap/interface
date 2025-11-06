import type { TransactionResponse } from '@ethersproject/abstract-provider'
import type { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type {
  InterfaceTransactionDetails,
  TransactionReceipt,
  TransactionStatus,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

/**
 * Re-export for backward compatibility
 *
 * @deprecated Use TransactionTypeInfo
 */
export type TransactionInfo = TransactionTypeInfo

// Web-specific pending transaction details with guaranteed pending status
export type PendingTransactionDetails = InterfaceTransactionDetails & {
  status: TransactionStatus.Pending
  lastCheckedBlockNumber?: number
  deadline?: number
}

// Web-specific confirmed transaction details with guaranteed confirmed/failed status
export type ConfirmedTransactionDetails = InterfaceTransactionDetails & {
  status: TransactionStatus.Success | TransactionStatus.Failed
  receipt: TransactionReceipt
}

export type TransactionDetails = PendingTransactionDetails | ConfirmedTransactionDetails

export type VitalTxFields = Pick<TransactionResponse, 'hash' | 'nonce' | 'data'>

export type LpIncentivesClaimTransactionStep = TransactionStep & {
  type: TransactionStepType.CollectLpIncentiveRewardsTransactionStep
  txRequest: ValidatedTransactionRequest
}
