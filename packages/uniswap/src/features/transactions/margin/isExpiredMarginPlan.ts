import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/** The backend's margin execute deadline (900s) plus its proof grace (300s); no margin plan can progress after it. */
const MARGIN_PLAN_EXPIRY_MS = 20 * ONE_MINUTE_MS

export function isExpiredMarginPlan(tx: TransactionDetails, now = Date.now()): boolean {
  return (
    isPlanTransactionDetails(tx) &&
    tx.typeInfo.marginAction !== undefined &&
    (tx.status === TransactionStatus.Pending || tx.status === TransactionStatus.AwaitingAction) &&
    now - tx.addedTime > MARGIN_PLAN_EXPIRY_MS
  )
}
