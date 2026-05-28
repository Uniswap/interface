import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export function getVisiblePlanSteps(stepDetails: TransactionDetails[]): TransactionDetails[] {
  return stepDetails.filter((step) => step.typeInfo.type !== TransactionType.Permit2Approve)
}
