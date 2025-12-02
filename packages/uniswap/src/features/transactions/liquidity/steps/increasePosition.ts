import { TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import {
  OnChainTransactionFields,
  OnChainTransactionFieldsBatched,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'

export interface IncreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.IncreasePositionTransaction
  sqrtRatioX96: string | undefined
}

export interface IncreasePositionTransactionStepAsync {
  // Requires permit
  type: TransactionStepType.IncreasePositionTransactionAsync
  getTxRequest(
    signature: string,
  ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96: string | undefined }>
}

export interface IncreasePositionTransactionStepBatched extends OnChainTransactionFieldsBatched {
  type: TransactionStepType.IncreasePositionTransactionBatched
  sqrtRatioX96: string | undefined
}

export function createIncreasePositionStep(
  txRequest: ValidatedTransactionRequest,
  sqrtRatioX96: string | undefined,
): IncreasePositionTransactionStep {
  return {
    type: TransactionStepType.IncreasePositionTransaction,
    txRequest,
    sqrtRatioX96,
  }
}

export function createCreatePositionAsyncStep(
  createPositionRequestArgs: TradingApi.CreateLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (
      signature: string,
    ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96: string | undefined }> => {
      if (!createPositionRequestArgs) {
        return { txRequest: undefined, sqrtRatioX96: undefined }
      }

      try {
        const { create, sqrtRatioX96 } = await TradingApiClient.createLpPosition({
          ...createPositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return { txRequest: validateTransactionRequest(create), sqrtRatioX96 }
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
    getTxRequest: async (
      signature: string,
    ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96: string | undefined }> => {
      if (!increasePositionRequestArgs) {
        return { txRequest: undefined, sqrtRatioX96: undefined }
      }

      try {
        const { increase, sqrtRatioX96 } = await TradingApiClient.increaseLpPosition({
          ...increasePositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return { txRequest: validateTransactionRequest(increase), sqrtRatioX96 }
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

export function createIncreasePositionStepBatched(
  txRequests: ValidatedTransactionRequest[],
  sqrtRatioX96: string | undefined,
): IncreasePositionTransactionStepBatched {
  return {
    type: TransactionStepType.IncreasePositionTransactionBatched,
    batchedTxRequests: txRequests,
    sqrtRatioX96,
  }
}
