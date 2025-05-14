import { SagaIterator } from 'redux-saga'
import { call } from 'typed-redux-saga'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  TransactionOptions,
  TransactionOriginType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import { createAnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsServiceImpl'
import { createFeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagServiceImpl'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import { createProviderService } from 'wallet/src/features/transactions/executeTransaction/services/providerServiceImpl'
import { createTransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigServiceImpl'
import { createTransactionRepositoryRedux } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepositoryImplRedux'
import { createTransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionServiceImpl'
import {
  TransactionResponse,
  TransactionSigner,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { createTransactionSignerService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerServiceImpl'
import { getSignerManager, walletContextValue } from 'wallet/src/features/wallet/context'
import { runSagaEffect } from 'wallet/src/state'
const logger = loggerUtil

export interface ExecuteTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: UniverseChainId
  account: AccountMeta
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  transactionOriginType: TransactionOriginType
  analytics?: SwapTradeBaseProperties
}

const transactionConfigService = createTransactionConfigService({
  featureFlagService: createFeatureFlagService(),
  logger,
})

// Create the transaction repository
const selectAddressTransactions = makeSelectAddressTransactions()
const transactionRepository = createTransactionRepositoryRedux({
  actions: transactionActions,
  makeSelectAddressTransactions: () => selectAddressTransactions,
  logger,
  runSagaEffect,
})

function* getTransactionSigner(input: {
  account: AccountMeta
  chainId: UniverseChainId
  getProvider: () => Promise<Provider>
}): SagaIterator<TransactionSigner> {
  // Create the transaction signer
  const signerManager = yield* call(getSignerManager)
  const transactionSigner = createTransactionSignerService({
    getAccount: () => input.account,
    getProvider: input.getProvider,
    getSignerManager: () => signerManager,
  })
  return transactionSigner
}

// Create the provider service
const providerService = createProviderService({
  getSignerManager: () => walletContextValue.signers,
})

// Create the analytics service
const analyticsService = createAnalyticsService({
  sendAnalyticsEvent,
  logger,
})

// A utility for sagas to send transactions
// All outgoing transactions should go through here
/**
 * Execute a transaction using clean architecture principles.
 * This saga orchestrates the transaction execution process.
 */
export function* executeTransactionV2(params: ExecuteTransactionParams): SagaIterator<{
  transactionResponse: TransactionResponse
}> {
  // Extract parameters for the transaction
  const { chainId, account, options, typeInfo, txId, transactionOriginType, analytics } = params

  // we get our provider here. private or not handled here,
  // the services below only care about a "provider"
  const getProvider = async (): Promise<Provider> => {
    const usePrivate = transactionConfigService.shouldUsePrivateRpc({
      chainId,
      submitViaPrivateRpc: options.submitViaPrivateRpc,
    })
    if (usePrivate) {
      return providerService.getPrivateProvider({ chainId, account })
    }
    return providerService.getProvider({ chainId })
  }

  const transactionSigner = yield* call(getTransactionSigner, {
    account,
    chainId,
    getProvider,
  })

  // Finally, create the transaction service with all dependencies
  const transactionService = createTransactionService({
    transactionRepository,
    transactionSigner,
    configService: transactionConfigService,
    analyticsService,
    logger,
    getProvider,
  })

  // Execute the transaction using the transaction service
  const result = yield* call([transactionService, transactionService.executeTransaction], {
    chainId,
    account,
    options,
    typeInfo,
    txId,
    transactionOriginType,
    analytics,
  })

  return result
}
