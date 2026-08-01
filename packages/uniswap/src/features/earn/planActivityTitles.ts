import { TradingApi } from '@universe/api'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

// Dynamic keys below; keep these literal t() calls visible to i18next-parser.
// t('transaction.status.deposit.success') t('transaction.status.deposit.pending')
// t('transaction.status.deposit.failed') t('transaction.status.deposit.canceling')
// t('transaction.status.deposit.canceled') t('transaction.status.deposit.interrupted')
// t('transaction.status.withdraw.success') t('transaction.status.withdraw.pending')
// t('transaction.status.withdraw.failed') t('transaction.status.withdraw.canceling')
// t('transaction.status.withdraw.canceled') t('transaction.status.withdraw.interrupted')

type EarnPlanTitleStatus = 'success' | 'pending' | 'failed' | 'canceling' | 'canceled' | 'awaitingAction'

export function getEarnPlanTransactionType(
  earnAction: TradingApi.EarnAction,
): TransactionType.Deposit | TransactionType.Withdraw {
  return earnAction === TradingApi.EarnAction.WITHDRAW ? TransactionType.Withdraw : TransactionType.Deposit
}

export function getEarnPlanInterruptedTitleKey(earnAction: TradingApi.EarnAction): string {
  return earnAction === TradingApi.EarnAction.WITHDRAW
    ? 'transaction.status.withdraw.interrupted'
    : 'transaction.status.deposit.interrupted'
}

function getEarnPlanStatusTitleKey({
  earnAction,
  status,
}: {
  earnAction: TradingApi.EarnAction
  status: EarnPlanTitleStatus
}): string {
  if (status === 'awaitingAction') {
    return getEarnPlanInterruptedTitleKey(earnAction)
  }

  const actionKey = earnAction === TradingApi.EarnAction.WITHDRAW ? 'withdraw' : 'deposit'
  return `transaction.status.${actionKey}.${status}`
}

export function getEarnPlanStatusTitleKeyFromTransactionStatus({
  earnAction,
  transactionStatus,
}: {
  earnAction: TradingApi.EarnAction
  transactionStatus: TransactionStatus
}): string {
  return getEarnPlanStatusTitleKey({
    earnAction,
    status: getEarnPlanTitleStatus(transactionStatus),
  })
}

function getEarnPlanTitleStatus(status: TransactionStatus): EarnPlanTitleStatus {
  switch (status) {
    case TransactionStatus.Success:
      return 'success'
    case TransactionStatus.Pending:
    case TransactionStatus.Queued:
    case TransactionStatus.Replacing:
      return 'pending'
    case TransactionStatus.Failed:
    case TransactionStatus.FailedCancel:
      return 'failed'
    case TransactionStatus.Cancelling:
      return 'canceling'
    case TransactionStatus.Canceled:
      return 'canceled'
    case TransactionStatus.AwaitingAction:
    default:
      return 'awaitingAction'
  }
}
