/* eslint-disable @jambit/typed-redux-saga/use-typed-effects -- typed-redux-saga doesn't export these correctly */
import type { PutEffect, SelectEffect } from 'redux-saga/effects'
import { put, type SagaGenerator, select } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AddressTransactionsSelector } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  type OnChainTransactionDetails,
  type TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { logger } from 'utilities/src/logger/logger'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import { RunSagaEffect } from 'wallet/src/state/createSagaEffectRunner'

interface TransactionRepositoryReduxContext {
  actions: typeof transactionActions
  makeSelectAddressTransactions: () => AddressTransactionsSelector
  logger: typeof logger
  runSagaEffect: RunSagaEffect
}

export const createTransactionRepositoryRedux = (ctx: TransactionRepositoryReduxContext): TransactionRepository => {
  return createAsyncTransactionRepository({
    sagaRepo: createSagaTransactionRepository(ctx),
    runSagaEffect: ctx.runSagaEffect,
  })
}

interface SagaTransactionRepository {
  addTransaction: (input: {
    transaction: OnChainTransactionDetails
  }) => SagaGenerator<
    ReturnType<typeof transactionActions.addTransaction>,
    PutEffect<ReturnType<typeof transactionActions.addTransaction>>
  >
  updateTransaction: (input: {
    transaction: OnChainTransactionDetails
    skipProcessing?: boolean
  }) => SagaGenerator<
    | ReturnType<typeof transactionActions.updateTransaction>
    | ReturnType<typeof transactionActions.updateTransactionWithoutWatch>,
    | PutEffect<ReturnType<typeof transactionActions.updateTransaction>>
    | PutEffect<ReturnType<typeof transactionActions.updateTransactionWithoutWatch>>
  >
  finalizeTransaction: (input: {
    transaction: OnChainTransactionDetails
    status: TransactionStatus
  }) => SagaGenerator<
    ReturnType<typeof transactionActions.finalizeTransaction>,
    PutEffect<ReturnType<typeof transactionActions.finalizeTransaction>>
  >
  getPendingPrivateTransactionCount: (input: {
    address: string
    chainId: UniverseChainId
  }) => SagaGenerator<number, SelectEffect>
  getTransactionsByAddress: (input: {
    address: string
  }) => SagaGenerator<TransactionDetails[] | undefined, SelectEffect>
}

/**
 * Create a transaction repository that returns saga effects
 */
function createSagaTransactionRepository(ctx: TransactionRepositoryReduxContext): SagaTransactionRepository {
  // Create the transaction selector once
  const selectAddressTransactions = ctx.makeSelectAddressTransactions()

  const addTransaction: SagaTransactionRepository['addTransaction'] = (input) => {
    // Log before returning the effect
    ctx.logger.debug('TransactionRepository', 'addTransaction', 'Transaction added:', {
      chainId: input.transaction.chainId,
      ...input.transaction.typeInfo,
    })

    return put(ctx.actions.addTransaction(input.transaction))
  }

  const updateTransaction: SagaTransactionRepository['updateTransaction'] = (input) => {
    // Log before returning the effect
    const method = input.skipProcessing ? 'updateTransactionWithoutWatch' : 'updateTransaction'
    ctx.logger.debug('TransactionRepository', method, 'Transaction updated:', {
      chainId: input.transaction.chainId,
      hash: input.transaction.hash,
      ...input.transaction.typeInfo,
    })

    if (input.skipProcessing) {
      return put(ctx.actions.updateTransactionWithoutWatch(input.transaction))
    }
    return put(ctx.actions.updateTransaction(input.transaction))
  }

  const finalizeTransaction: SagaTransactionRepository['finalizeTransaction'] = (input) => {
    // Log before returning the effect
    ctx.logger.debug('TransactionRepository', 'finalizeTransaction', 'Transaction finalized:', {
      chainId: input.transaction.chainId,
      hash: input.transaction.hash,
      status: input.status,
      ...input.transaction.typeInfo,
    })

    return put(
      ctx.actions.finalizeTransaction({
        ...input.transaction,
        // @ts-expect-error - TODO: fix this
        status: input.status,
      }),
    )
  }

  const getPendingPrivateTransactionCount: SagaTransactionRepository['getPendingPrivateTransactionCount'] = (input) => {
    // Return a select effect that will get and filter transactions
    return select((state: UniswapState) => {
      const pendingTransactions = selectAddressTransactions(state, { evmAddress: input.address, svmAddress: null })

      if (!pendingTransactions) {
        return 0
      }

      const filteredTransactions: TransactionDetails[] = pendingTransactions.filter((tx) =>
        Boolean(
          tx.chainId === input.chainId &&
            tx.status === TransactionStatus.Pending &&
            isClassic(tx) &&
            Boolean(tx.options.submitViaPrivateRpc) &&
            tx.hash,
        ),
      )

      return filteredTransactions.length
    }) as SagaGenerator<number, SelectEffect>
  }

  const getTransactionsByAddress: SagaTransactionRepository['getTransactionsByAddress'] = (input) => {
    // Return a select effect
    return select((state: UniswapState) => {
      const transactions = selectAddressTransactions(state, { evmAddress: input.address, svmAddress: null })

      if (!transactions) {
        return undefined
      }

      return transactions as TransactionDetails[]
    }) as SagaGenerator<TransactionDetails[] | undefined, SelectEffect>
  }

  return {
    addTransaction,
    updateTransaction,
    finalizeTransaction,
    getPendingPrivateTransactionCount,
    getTransactionsByAddress,
  }
}

/**
 * Create an async transaction repository that works in non-saga contexts
 */
function createAsyncTransactionRepository(ctx: {
  sagaRepo: ReturnType<typeof createSagaTransactionRepository>
  runSagaEffect: RunSagaEffect
}): TransactionRepository {
  return {
    async addTransaction(input: { transaction: OnChainTransactionDetails }): Promise<void> {
      await ctx.runSagaEffect(ctx.sagaRepo.addTransaction(input))
    },

    async updateTransaction(input: {
      transaction: OnChainTransactionDetails
      skipProcessing?: boolean
    }): Promise<void> {
      await ctx.runSagaEffect(ctx.sagaRepo.updateTransaction(input))
    },

    async finalizeTransaction(input: {
      transaction: OnChainTransactionDetails
      status: TransactionStatus
    }): Promise<void> {
      await ctx.runSagaEffect(ctx.sagaRepo.finalizeTransaction(input))
    },

    async getPendingPrivateTransactionCount(input: { address: string; chainId: UniverseChainId }): Promise<number> {
      return await ctx.runSagaEffect(ctx.sagaRepo.getPendingPrivateTransactionCount(input))
    },

    async getTransactionsByAddress(input: { address: string }): Promise<TransactionDetails[] | undefined> {
      return await ctx.runSagaEffect(ctx.sagaRepo.getTransactionsByAddress(input))
    },
  }
}
