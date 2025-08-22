import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { logger } from 'utilities/src/logger/logger'
import { getAccountDelegationDetails } from 'wallet/src/features/smartWallet/delegation/utils'
import { createTransactionRepositoryRedux } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepositoryImplRedux'
import { createTransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionServiceImpl'
import {
  createBundledDelegationTransactionSignerService,
  createTransactionSignerService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerServiceImpl'
import { createAnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsServiceImpl'
import { createFeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagServiceImpl'
import { createProviderService } from 'wallet/src/features/transactions/executeTransaction/services/providerServiceImpl'
import { createTransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigServiceImpl'
import { createTransactionExecutor } from 'wallet/src/features/transactions/swap/services/transactionExecutor'
import { createTransactionParamsFactory } from 'wallet/src/features/transactions/swap/services/transactionParamsFactory'
import { TransactionSagaDependencies } from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { runSagaEffect } from 'wallet/src/state'

/**
 * Creates the default dependencies for transaction sagas
 * This factory provides all the services needed for executing transactions
 * across different transaction types (swaps, dapp transactions, etc.)
 */
export function createTransactionSagaDependencies(): TransactionSagaDependencies {
  return {
    // Core service factories
    createProviderService,
    createTransactionConfigService,
    createTransactionSignerService,
    createBundledDelegationTransactionSignerService,
    createTransactionService,
    createAnalyticsService,
    createTransactionRepository: createTransactionRepositoryRedux,
    createFeatureFlagService,
    createTransactionExecutor,
    createTransactionParamsFactory,

    // External dependencies
    getViemClients: () => walletContextValue.viemClients,
    getDelegationDetails: getAccountDelegationDetails,
    logger,
    sendAnalyticsEvent,
    transactionActions,
    makeSelectAddressTransactions,
    runSagaEffect,
  }
}
