import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { WrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import type { UniswapXSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'

export type UniswapXSwapSteps =
  | WrapTransactionStep
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | UniswapXSignatureStep

export type UniswapXSwapFlow = {
  wrap?: WrapTransactionStep
  revocation?: TokenRevocationTransactionStep
  approval?: TokenApprovalTransactionStep
  signOrder: UniswapXSignatureStep
}

export function orderUniswapXSteps(flow: UniswapXSwapFlow): UniswapXSwapSteps[] {
  const steps: UniswapXSwapSteps[] = []

  if (flow.wrap) {
    steps.push(flow.wrap)
  }

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  steps.push(flow.signOrder)

  return steps
}
