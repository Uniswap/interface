import {
  MigratePositionTransactionStep,
  MigratePositionTransactionStepAsync,
} from 'uniswap/src/features/transactions/liquidity/steps/migrate'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import type { Permit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import type { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'

export type MigrationSteps =
  | Permit2SignatureStep
  | Permit2TransactionStep
  | MigratePositionTransactionStep
  | MigratePositionTransactionStepAsync
  | TokenApprovalTransactionStep

export type MigrationFlow =
  | {
      permit: undefined
      migrate: MigratePositionTransactionStep
      positionTokenPermitTransaction?: Permit2TransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
    }
  | {
      permit: Permit2SignatureStep
      positionTokenPermitTransaction: undefined
      migrate: MigratePositionTransactionStepAsync
      approvalPositionToken: undefined
    }

export function orderMigrateLiquiditySteps(flow: MigrationFlow): MigrationSteps[] {
  const steps: MigrationSteps[] = []

  if (flow.permit) {
    steps.push(flow.permit)
  }

  if (flow.positionTokenPermitTransaction) {
    steps.push(flow.positionTokenPermitTransaction)
  }

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  steps.push(flow.migrate)

  return steps
}
