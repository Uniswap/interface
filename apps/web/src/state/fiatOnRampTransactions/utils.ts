import { FiatOnRampTransactionStatus } from 'state/fiatOnRampTransactions/types'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

export function statusToTransactionInfoStatus(status: FORTransaction['status']): FiatOnRampTransactionStatus {
  switch (status) {
    case 'FAILED':
    case 'ERROR':
    case 'VOIDED':
      return FiatOnRampTransactionStatus.FAILED
    case 'SETTLED':
      return FiatOnRampTransactionStatus.COMPLETE
    default:
      return FiatOnRampTransactionStatus.PENDING
  }
}
export function forTransactionStatusToTransactionStatus(status: FiatOnRampTransactionStatus): TransactionStatus {
  switch (status) {
    case FiatOnRampTransactionStatus.FAILED:
      return TransactionStatus.Failed
    case FiatOnRampTransactionStatus.COMPLETE:
      return TransactionStatus.Success
    case FiatOnRampTransactionStatus.PENDING:
    default:
      return TransactionStatus.Pending
  }
}
