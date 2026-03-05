import { MigrateV3ToV4LPPositionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
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
  migratePositionRequestArgs: MigrateV3ToV4LPPositionRequest | undefined,
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
        const updatedRequest = new MigrateV3ToV4LPPositionRequest({
          ...migratePositionRequestArgs,
          signature,
          signatureDeadline: Number(signatureDeadline),
          simulateTransaction: true,
        })
        const migrate = (await LiquidityServiceClient.migrateV3ToV4LpPosition(updatedRequest)).migrate
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
