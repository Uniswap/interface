import {
  MigratePositionTransactionStep,
  MigratePositionTransactionStepAsync,
} from 'uniswap/src/features/transactions/liquidity/steps/migrate'
import { Permit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'

export type MigrationSteps = Permit2SignatureStep | MigratePositionTransactionStep | MigratePositionTransactionStepAsync

export type MigrationFlow =
  | { permit: undefined; migrate: MigratePositionTransactionStep }
  | { permit: Permit2SignatureStep; migrate: MigratePositionTransactionStepAsync }

export function orderMigrateLiquiditySteps(flow: MigrationFlow): MigrationSteps[] {
  const steps: MigrationSteps[] = []

  if (flow.permit) {
    steps.push(flow.permit)
  }

  steps.push(flow.migrate)

  return steps
}
