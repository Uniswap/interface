import { DecreasePositionTransactionStep } from 'uniswap/src/features/transactions/liquidity/steps/decreasePosition'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'

export type DecreaseLiquiditySteps = TokenApprovalTransactionStep | DecreasePositionTransactionStep

export type DecreaseLiquidityFlow = {
  approvalPositionToken?: TokenApprovalTransactionStep
  decreasePosition: DecreasePositionTransactionStep
}

export function orderDecreaseLiquiditySteps(flow: DecreaseLiquidityFlow): DecreaseLiquiditySteps[] {
  const steps: DecreaseLiquiditySteps[] = []

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  steps.push(flow.decreasePosition)

  return steps
}
