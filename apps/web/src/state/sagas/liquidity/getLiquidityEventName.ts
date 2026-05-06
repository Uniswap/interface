import { LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

export function getLiquidityEventName(
  stepType: TransactionStepType,
):
  | LiquidityEventName.AddLiquiditySubmitted
  | LiquidityEventName.RemoveLiquiditySubmitted
  | LiquidityEventName.MigrateLiquiditySubmitted
  | LiquidityEventName.CollectLiquiditySubmitted {
  switch (stepType) {
    case TransactionStepType.IncreasePositionTransaction:
    case TransactionStepType.IncreasePositionTransactionAsync:
      return LiquidityEventName.AddLiquiditySubmitted
    case TransactionStepType.DecreasePositionTransaction:
      return LiquidityEventName.RemoveLiquiditySubmitted
    case TransactionStepType.MigratePositionTransaction:
    case TransactionStepType.MigratePositionTransactionAsync:
      return LiquidityEventName.MigrateLiquiditySubmitted
    case TransactionStepType.CollectFeesTransactionStep:
      return LiquidityEventName.CollectLiquiditySubmitted
    default:
      throw new Error('Unexpected step type')
  }
}
