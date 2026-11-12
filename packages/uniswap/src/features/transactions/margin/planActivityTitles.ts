import type { TFunction } from 'i18next'
import type { MarginActionKey } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

// t('transaction.status.margin.success') t('transaction.status.margin.pending')
// t('transaction.status.margin.failed') t('transaction.status.margin.interrupted')
// t('transaction.status.marginClose.success') t('transaction.status.marginClose.pending')
// t('transaction.status.marginClose.failed') t('transaction.status.marginClose.interrupted')
// t('transaction.status.marginUpdate.success') t('transaction.status.marginUpdate.pending')
// t('transaction.status.marginUpdate.failed') t('transaction.status.marginUpdate.interrupted')

const NAMESPACES: Partial<Record<MarginActionKey, string>> = { open: 'margin', close: 'marginClose' }

// A CANCELLED margin plan maps to FAILED, so plans are never canceled.
const STATUSES: Partial<Record<TransactionStatus, string>> = {
  [TransactionStatus.Success]: 'success',
  [TransactionStatus.Failed]: 'failed',
  [TransactionStatus.AwaitingAction]: 'interrupted',
}

/** The activity title for a margin plan, e.g. "Position opened"; adjustments read as a position update. */
export function getMarginPlanStatusTitleKey(action: MarginActionKey | undefined, status: TransactionStatus): string {
  return `transaction.status.${(action && NAMESPACES[action]) ?? 'marginUpdate'}.${STATUSES[status] ?? 'pending'}`
}

/** The label for a margin plan's own step in the plan drawer, from the plan's action. */
export function getMarginPlanStepLabel(action: MarginActionKey | undefined, t: TFunction): string {
  switch (action) {
    case 'open':
      return t('margin.plan.step.open')
    case 'close':
      return t('margin.plan.title.close')
    case 'addEquity':
      return t('margin.plan.title.addMargin')
    case 'withdrawEquity':
      return t('margin.plan.title.withdrawMargin')
    case 'increaseLeverage':
      return t('margin.plan.title.increaseLeverage')
    case 'decreaseLeverage':
      return t('margin.plan.title.decreaseLeverage')
    default:
      return t('margin.plan.title.adjust')
  }
}
