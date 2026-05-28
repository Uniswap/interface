import {
  CreatePositionRequest,
  IncreasePositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { V2LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import {
  OnChainTransactionFields,
  OnChainTransactionFieldsWalletCall,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
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
  getTxRequest(signature: string): Promise<{ txRequest: ValidatedTransactionRequest | undefined }>
}

export interface IncreasePositionTransactionStepWalletCall extends OnChainTransactionFieldsWalletCall {
  type: TransactionStepType.IncreasePositionTransactionWalletCall
}

export function createIncreasePositionStep(txRequest: ValidatedTransactionRequest): IncreasePositionTransactionStep {
  return {
    type: TransactionStepType.IncreasePositionTransaction,
    txRequest,
  }
}

export function createCreatePositionAsyncStep(
  createPositionRequestArgs: CreatePositionRequest | undefined,
  delegatedAddress?: string | null,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (signature: string): Promise<{ txRequest: ValidatedTransactionRequest | undefined }> => {
      if (!createPositionRequestArgs) {
        return { txRequest: undefined }
      }

      try {
        const updatedRequest = new CreatePositionRequest({
          // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
          ...createPositionRequestArgs,
          signature,
          simulateTransaction: true,
        })
        const result = await V2LiquidityServiceClient.createPosition(updatedRequest)
        return { txRequest: validateTransactionRequest(result.create) }
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
            // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
            ...createPositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}

export function createIncreasePositionAsyncStep(
  increasePositionRequestArgs: IncreasePositionRequest | undefined,
  delegatedAddress?: string | null,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (signature: string): Promise<{ txRequest: ValidatedTransactionRequest | undefined }> => {
      if (!increasePositionRequestArgs) {
        return { txRequest: undefined }
      }

      try {
        const updatedRequest = new IncreasePositionRequest({
          // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
          ...increasePositionRequestArgs,
          signature,
          simulateTransaction: true,
        })
        const result = await V2LiquidityServiceClient.increasePosition(updatedRequest)
        return { txRequest: validateTransactionRequest(result.increase) }
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'generateTransactionSteps',
              function: 'createIncreasePositionAsyncStep',
            },
            extra: {
              canBatchTransactions: false,
              delegatedAddress: delegatedAddress ?? null,
            },
          })
          sendAnalyticsEvent(InterfaceEventName.IncreaseLiquidityFailed, {
            message,
            // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
            ...increasePositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}

export function createIncreasePositionStepWalletCall(
  txRequests: ValidatedTransactionRequest[],
): IncreasePositionTransactionStepWalletCall {
  return {
    type: TransactionStepType.IncreasePositionTransactionWalletCall,
    walletCallTxRequests: txRequests,
  }
}
