import {
  CreateLPPositionRequest,
  IncreaseLPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  V2CreateLPPosition,
  V3CreateLPPosition,
  V4CreateLPPosition,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
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
  createPositionRequestArgs: CreateLPPositionRequest | undefined,
  delegatedAddress?: string | null,
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
        const { createLpPosition } = createPositionRequestArgs
        let updatedCreateLpPosition

        if (createLpPosition.case === 'v4CreateLpPosition') {
          updatedCreateLpPosition = {
            case: 'v4CreateLpPosition' as const,
            value: new V4CreateLPPosition({
              ...createLpPosition.value,
              signature,
              simulateTransaction: true,
            }),
          }
        } else if (createLpPosition.case === 'v3CreateLpPosition') {
          updatedCreateLpPosition = {
            case: 'v3CreateLpPosition' as const,
            value: new V3CreateLPPosition({
              ...createLpPosition.value,
              signature,
              simulateTransaction: true,
            }),
          }
        } else if (createLpPosition.case === 'v2CreateLpPosition') {
          // V2 does not support signatures, only simulate flag
          updatedCreateLpPosition = {
            case: 'v2CreateLpPosition' as const,
            value: new V2CreateLPPosition({
              ...createLpPosition.value,
              simulateTransaction: true,
            }),
          }
        } else {
          updatedCreateLpPosition = createLpPosition
        }

        const result = await LiquidityServiceClient.createLpPosition(
          new CreateLPPositionRequest({
            createLpPosition: updatedCreateLpPosition,
          }),
        )
        const create = result.create
        const sqrtRatioX96 = result.sqrtRatioX96

        return { txRequest: validateTransactionRequest(create), sqrtRatioX96 }
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'increasePosition',
              function: 'createCreatePositionAsyncStep',
            },
            extra: {
              canBatchTransactions: false, // if in this step then the tx was not batched
              delegatedAddress: delegatedAddress ?? null,
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
  increasePositionRequestArgs: IncreaseLPPositionRequest | undefined,
  delegatedAddress?: string | null,
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
        const { increaseLpPosition } = increasePositionRequestArgs
        const updatedIncreaseLpPosition =
          increaseLpPosition.case === 'v4IncreaseLpPosition'
            ? {
                case: 'v4IncreaseLpPosition' as const,
                value: { ...increaseLpPosition.value, signature, simulateTransaction: true },
              }
            : increaseLpPosition.case === 'v3IncreaseLpPosition'
              ? {
                  case: 'v3IncreaseLpPosition' as const,
                  value: { ...increaseLpPosition.value, signature, simulateTransaction: true },
                }
              : increaseLpPosition
        const result = await LiquidityServiceClient.increaseLpPosition(
          new IncreaseLPPositionRequest({
            increaseLpPosition: updatedIncreaseLpPosition,
          }),
        )
        const increase = result.increase
        const sqrtRatioX96 = result.sqrtRatioX96

        return { txRequest: validateTransactionRequest(increase), sqrtRatioX96 }
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'generateTransactionSteps',
              function: 'createIncreasePositionAsyncStep',
            },
            extra: {
              canBatchTransactions: false, // if in this step then the tx was not batched
              delegatedAddress: delegatedAddress ?? null,
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
