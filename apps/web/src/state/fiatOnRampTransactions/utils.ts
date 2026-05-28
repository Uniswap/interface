import type { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { FORTransactionStatus } from 'uniswap/src/features/fiatOnRamp/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { FiatOnRampTransactionStatus } from '~/state/fiatOnRampTransactions/types'

// oxlint-disable-next-line typescript/consistent-return
export function statusToTransactionInfoStatus(status: FORTransaction['status']): FiatOnRampTransactionStatus {
  switch (status) {
    case FORTransactionStatus.FAILED:
      return FiatOnRampTransactionStatus.FAILED
    case FORTransactionStatus.SETTLED:
      return FiatOnRampTransactionStatus.COMPLETE
    case FORTransactionStatus.PENDING:
      return FiatOnRampTransactionStatus.PENDING
  }
}
// oxlint-disable-next-line typescript/consistent-return
export function forTransactionStatusToTransactionStatus(status: FiatOnRampTransactionStatus): TransactionStatus {
  switch (status) {
    case FiatOnRampTransactionStatus.FAILED:
      return TransactionStatus.Failed
    case FiatOnRampTransactionStatus.COMPLETE:
      return TransactionStatus.Success
    case FiatOnRampTransactionStatus.INITIATED:
    case FiatOnRampTransactionStatus.PENDING:
      return TransactionStatus.Pending
  }
}
