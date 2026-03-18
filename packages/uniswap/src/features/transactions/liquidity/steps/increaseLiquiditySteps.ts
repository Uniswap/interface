import {
  IncreasePositionTransactionStep,
  IncreasePositionTransactionStepAsync,
  IncreasePositionTransactionStepBatched,
} from 'uniswap/src/features/transactions/liquidity/steps/increasePosition'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { Permit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'

export type IncreaseLiquiditySteps =
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | Permit2SignatureStep
  | Permit2TransactionStep
  | IncreasePositionTransactionStep
  | IncreasePositionTransactionStepAsync
  | IncreasePositionTransactionStepBatched

export type IncreaseLiquidityFlow =
  | {
      approvalToken0?: TokenApprovalTransactionStep
      approvalToken1?: TokenApprovalTransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
      revokeToken0?: TokenRevocationTransactionStep
      revokeToken1?: TokenRevocationTransactionStep
      permit: Permit2SignatureStep
      token0PermitTransaction: undefined
      token1PermitTransaction: undefined
      increasePosition: IncreasePositionTransactionStepAsync
    }
  | {
      approvalToken0?: TokenApprovalTransactionStep
      approvalToken1?: TokenApprovalTransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
      revokeToken0?: TokenRevocationTransactionStep
      revokeToken1?: TokenRevocationTransactionStep
      permit: undefined
      token0PermitTransaction: Permit2TransactionStep | undefined
      token1PermitTransaction: Permit2TransactionStep | undefined
      increasePosition: IncreasePositionTransactionStep
    }
export function orderIncreaseLiquiditySteps(flow: IncreaseLiquidityFlow): IncreaseLiquiditySteps[] {
  const steps: IncreaseLiquiditySteps[] = []

  if (flow.revokeToken0) {
    steps.push(flow.revokeToken0)
  }

  if (flow.revokeToken1) {
    steps.push(flow.revokeToken1)
  }

  if (flow.approvalToken0) {
    steps.push(flow.approvalToken0)
  }

  if (flow.approvalToken1) {
    steps.push(flow.approvalToken1)
  }

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  if (flow.permit) {
    steps.push(flow.permit)
  }

  if (flow.token0PermitTransaction) {
    steps.push(flow.token0PermitTransaction)
  }

  if (flow.token1PermitTransaction) {
    steps.push(flow.token1PermitTransaction)
  }

  steps.push(flow.increasePosition)

  return steps
}
