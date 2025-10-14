import { TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
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
  getTxRequest(
    signature: string,
  ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96?: string }>
}

export function createMigratePositionStep(txRequest: ValidatedTransactionRequest): MigratePositionTransactionStep {
  return {
    type: TransactionStepType.MigratePositionTransaction,
    txRequest,
  }
}

export function createMigratePositionAsyncStep(
  migratePositionRequestArgs: TradingApi.MigrateLPPositionRequest | undefined,
  signatureDeadline: number | undefined,
): MigratePositionTransactionStepAsync {
  return {
    type: TransactionStepType.MigratePositionTransactionAsync,
    getTxRequest: async (
      signature: string,
    ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96?: string }> => {
      if (!migratePositionRequestArgs || !signatureDeadline) {
        return { txRequest: undefined }
      }

      try {
        const { migrate } = await TradingApiClient.migrateLpPosition({
          ...migratePositionRequestArgs,
          signature,
          signatureDeadline,
          simulateTransaction: true,
        })

        return { txRequest: validateTransactionRequest(migrate) }
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
