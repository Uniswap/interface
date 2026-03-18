import type { TransactionRequest } from '@ethersproject/providers'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import type { transactionActions } from 'uniswap/src/features/transactions/slice'
import type { Logger } from 'utilities/src/logger/logger'
import type { PublicClient } from 'viem'
import type { ViemClientManager } from 'wallet/src/features/providers/ViemClientManager'
import type { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { FeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagService'
import type {
  Provider,
  ProviderService,
} from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import type { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'
import type { TransactionExecutor } from 'wallet/src/features/transactions/swap/services/transactionExecutor'
import type { TransactionParamsFactory } from 'wallet/src/features/transactions/swap/services/transactionParamsFactory'
import type { BaseTransactionContext } from 'wallet/src/features/transactions/swap/types/transactionExecutor'
import type { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import type { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import type { RunSagaEffect } from 'wallet/src/state/createSagaEffectRunner'

/**
 * Defines the type of delegation handling required for a transaction
 */
export enum DelegationType {
  /** Auto-detect delegation based on account and transaction properties */
  Auto = 'AUTO',
  /** Transaction should include delegation. Only used for swaps, when the transaction is already prepared with delegation */
  Delegate = 'DELEGATE',
  /** Transaction should remove delegation */
  RemoveDelegation = 'REMOVE_DELEGATION',
}

/**
 * Dependencies for transaction sagas - provides all services needed for executing transactions
 * across different transaction types (swaps, dapp transactions, etc.)
 */
export interface TransactionSagaDependencies {
  // Core service factories
  createProviderService: (params: { getSignerManager: () => SignerManager }) => ProviderService
  createTransactionConfigService: (params: {
    featureFlagService: FeatureFlagService
    logger: Logger
  }) => TransactionConfigService
  createTransactionSignerService: (params: {
    getAccount: () => SignerMnemonicAccountMeta
    getProvider: () => Promise<Provider>
    getSignerManager: () => SignerManager
  }) => TransactionSigner
  createBundledDelegationTransactionSignerService: (params: {
    delegationInfo: DelegationCheckResult
    getAccount: () => SignerMnemonicAccountMeta
    getProvider: () => Promise<Provider>
    getViemClient: () => Promise<PublicClient>
    getSignerManager: () => SignerManager
  }) => TransactionSigner
  createTransactionService: (params: {
    transactionRepository: TransactionRepository
    transactionSigner: TransactionSigner
    configService: TransactionConfigService
    analyticsService: AnalyticsService
    logger: Logger
    getProvider: () => Promise<Provider>
  }) => TransactionService
  createAnalyticsService: (params: {
    sendAnalyticsEvent: typeof sendAnalyticsEvent
    logger: Logger
  }) => AnalyticsService
  createTransactionRepository: (params: {
    actions: typeof transactionActions
    makeSelectAddressTransactions: () => ReturnType<typeof makeSelectAddressTransactions>
    logger: Logger
    runSagaEffect: RunSagaEffect
  }) => TransactionRepository
  createFeatureFlagService: () => FeatureFlagService
  createTransactionExecutor: (transactionService: TransactionService) => TransactionExecutor
  createTransactionParamsFactory: (context: BaseTransactionContext) => TransactionParamsFactory

  // External dependencies
  getViemClients: () => ViemClientManager
  getDelegationInfoForTransaction: (params: {
    delegationType: DelegationType
    activeAccount: SignerMnemonicAccount
    chainId: UniverseChainId
    transactionRequest?: TransactionRequest
    logger: Logger
  }) => Promise<DelegationCheckResult>
  logger: Logger
  sendAnalyticsEvent: typeof sendAnalyticsEvent
  transactionActions: typeof transactionActions
  makeSelectAddressTransactions: () => ReturnType<typeof makeSelectAddressTransactions>
  runSagaEffect: RunSagaEffect
}
