import {
  PlanTransactionInfo,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

/** A margin plan waiting on the user, with no step transaction already in flight. */
export function isResumableMarginPlan(
  typeInfo: TransactionTypeInfo,
  status: TransactionStatus,
): typeInfo is PlanTransactionInfo {
  return (
    typeInfo.type === TransactionType.Plan &&
    typeInfo.marginAction !== undefined &&
    (status === TransactionStatus.AwaitingAction || status === TransactionStatus.Pending) &&
    !typeInfo.stepDetails.some((step) => step.status === TransactionStatus.Pending)
  )
}
