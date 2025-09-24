import { TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'

export interface IncreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.IncreasePositionTransaction
}

export interface IncreasePositionTransactionStepAsync {
  // Requires permit
  type: TransactionStepType.IncreasePositionTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined>
}

export function createIncreasePositionStep(txRequest: ValidatedTransactionRequest): IncreasePositionTransactionStep {
  return {
    type: TransactionStepType.IncreasePositionTransaction,
    txRequest,
  }
}

export function createCreatePositionAsyncStep(
  createPositionRequestArgs: TradingApi.CreateLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!createPositionRequestArgs) {
        return undefined
      }

      try {
        const { create } = await TradingApiClient.createLpPosition({
          ...createPositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return validateTransactionRequest(create)
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'increasePosition',
              function: 'createCreatePositionAsyncStep',
            },
          })

          sendAnalyticsEvent(InterfaceEventName.CreatePositionFailed, {
            message,
            ...createPositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}

export function createIncreasePositionAsyncStep(
  increasePositionRequestArgs: TradingApi.IncreaseLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!increasePositionRequestArgs) {
        return undefined
      }

      try {
        const { increase } = await TradingApiClient.increaseLpPosition({
          ...increasePositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return validateTransactionRequest(increase)
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'generateTransactionSteps',
              function: 'createIncreasePositionAsyncStep',
            },
          })
          sendAnalyticsEvent(InterfaceEventName.IncreaseLiquidityFailed, {
            message,
            ...increasePositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}
