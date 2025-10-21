import { migrateLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { MigrateLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'

export interface MigratePositionTransactionStep extends OnChainTransactionFields {
  // Migrations that don't require permit
  type: TransactionStepType.MigratePositionTransaction
}

export interface MigratePositionTransactionStepAsync {
  // Migrations that require permit
  type: TransactionStepType.MigratePositionTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined>
}

export function createMigratePositionStep(txRequest: ValidatedTransactionRequest): MigratePositionTransactionStep {
  return {
    type: TransactionStepType.MigratePositionTransaction,
    txRequest,
  }
}

export function createMigratePositionAsyncStep(
  migratePositionRequestArgs: MigrateLPPositionRequest | undefined,
  signatureDeadline: number | undefined,
): MigratePositionTransactionStepAsync {
  return {
    type: TransactionStepType.MigratePositionTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!migratePositionRequestArgs || !signatureDeadline) {
        return undefined
      }

      try {
        const { migrate } = await migrateLpPosition({
          ...migratePositionRequestArgs,
          signature,
          signatureDeadline,
          simulateTransaction: true,
        })

        return validateTransactionRequest(migrate)
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'migrate.ts',
              function: 'createMigratePositionAsyncStep',
            },
          })
          sendAnalyticsEvent(InterfaceEventName.MigrateLiquidityFailed, {
            message,
            ...migratePositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}
