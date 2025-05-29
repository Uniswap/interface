import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import type { UniswapXSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'

export type UniswapXSwapFlow = {
  revocation?: TokenRevocationTransactionStep
  approval?: TokenApprovalTransactionStep
  signOrder: UniswapXSignatureStep
}

export type UniswapXSwapSteps = NonNullable<UniswapXSwapFlow[keyof UniswapXSwapFlow]>

export function orderUniswapXSteps(flow: UniswapXSwapFlow): UniswapXSwapSteps[] {
  const steps: UniswapXSwapSteps[] = []

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  steps.push(flow.signOrder)

  return steps
}
