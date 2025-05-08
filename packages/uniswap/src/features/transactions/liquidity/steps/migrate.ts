import { migrateLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { MigrateLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import {
  ValidatedTransactionRequest,
  validateTransactionRequest,
} from 'uniswap/src/features/transactions/swap/utils/trade'

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
        })

        return validateTransactionRequest(migrate)
      } catch (e) {
        throw new Error('migrate failed to get transaction request', {
          cause: parseErrorMessageTitle(e, { includeRequestId: true }),
        })
      }
    },
  }
}
