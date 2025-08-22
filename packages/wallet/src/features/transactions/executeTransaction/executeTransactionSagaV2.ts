import { SagaIterator } from 'redux-saga'
import { call, select } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
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
import { PublicClient } from 'viem'
import { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import { getAccountDelegationDetails } from 'wallet/src/features/smartWallet/delegation/utils'
import { createTransactionRepositoryRedux } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepositoryImplRedux'
import { createTransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionServiceImpl'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import {
  createBundledDelegationTransactionSignerService,
  createTransactionSignerService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerServiceImpl'
import { createAnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsServiceImpl'
import { createFeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagServiceImpl'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import { createProviderService } from 'wallet/src/features/transactions/executeTransaction/services/providerServiceImpl'
import { createTransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigServiceImpl'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { getSignerManager, walletContextValue } from 'wallet/src/features/wallet/context'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { runSagaEffect } from 'wallet/src/state'
const logger = loggerUtil

export interface ExecuteTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: UniverseChainId
  account: SignerMnemonicAccountMeta
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  transactionOriginType: TransactionOriginType
  analytics?: SwapTradeBaseProperties
  preSignedTransaction?: SignedTransactionRequest // Pre-signed transaction to skip signing step
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
  account: SignerMnemonicAccountMeta
  chainId: UniverseChainId
  getProvider: () => Promise<Provider>
  getViemClient: () => Promise<PublicClient>
  getDelegationInfo: () => Promise<DelegationCheckResult>
}): SagaIterator<TransactionSigner> {
  // Create the transaction signer
  const signerManager = yield* call(getSignerManager)

  const delegationDetails = yield* call(input.getDelegationInfo)
  if (delegationDetails.needsDelegation) {
    const delegationBundledTransactionSigner = createBundledDelegationTransactionSignerService({
      getAccount: () => input.account,
      getProvider: input.getProvider,
      getViemClient: input.getViemClient,
      getSignerManager: () => signerManager,
      getDelegationInfo: input.getDelegationInfo,
    })
    return delegationBundledTransactionSigner
  }

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
  transactionHash: string
}> {
  // Extract parameters for the transaction
  const { chainId, account, options, typeInfo, txId, transactionOriginType, analytics, preSignedTransaction } = params

  const signerAccounts = yield* select(selectSortedSignerMnemonicAccounts)
  const activeAccount = signerAccounts.find((a) => a.address === account.address)
  if (!activeAccount) {
    throw new Error('Active account not found')
  }

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

  const getViemClient = async (): Promise<PublicClient> => {
    const usePrivate = transactionConfigService.shouldUsePrivateRpc({
      chainId,
      submitViaPrivateRpc: options.submitViaPrivateRpc,
    })

    if (usePrivate) {
      return walletContextValue.viemClients.getPrivateViemClient(chainId)
    }
    return walletContextValue.viemClients.getViemClient(chainId)
  }

  const getDelegationInfo = async (): Promise<DelegationCheckResult> => {
    // check redux for smart wallet consent
    if (!activeAccount.smartWalletConsent) {
      return {
        needsDelegation: false,
      }
    }

    return getAccountDelegationDetails(activeAccount.address, chainId)
  }

  const transactionSigner = yield* call(getTransactionSigner, {
    account,
    chainId,
    getProvider,
    getViemClient,
    getDelegationInfo,
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
    preSignedTransaction,
  })

  return result
}
