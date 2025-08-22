import { SagaIterator } from 'redux-saga'
import { call, select } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PublicClient } from 'viem'
import { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import { TransactionSagaDependencies } from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'

/**
 * Creates transaction services with injected dependencies
 * This function is reusable across different sagas that need transaction services
 */
export function* createTransactionServices(
  dependencies: TransactionSagaDependencies,
  input: {
    account: SignerMnemonicAccountMeta
    chainId: UniverseChainId
    submitViaPrivateRpc: boolean
    includesDelegation: boolean
  },
): SagaIterator<{ transactionSigner: TransactionSigner; transactionService: TransactionService }> {
  const signerManager = yield* call(getSignerManager)
  const signerAccounts = yield* select(selectSortedSignerMnemonicAccounts)
  const activeAccount = signerAccounts.find((a) => a.address === input.account.address)

  if (!activeAccount) {
    throw new Error('Active account not found')
  }

  // Create services using injected factories
  const providerService = dependencies.createProviderService({
    getSignerManager: () => signerManager,
  })

  const getProvider = (): Promise<Provider> =>
    input.submitViaPrivateRpc
      ? providerService.getPrivateProvider({ chainId: input.chainId, account: input.account })
      : providerService.getProvider({ chainId: input.chainId })

  const transactionConfigService = dependencies.createTransactionConfigService({
    featureFlagService: dependencies.createFeatureFlagService(),
    logger: dependencies.logger,
  })

  const getViemClient = async (): Promise<PublicClient> => {
    const viemClients = dependencies.getViemClients()
    return input.submitViaPrivateRpc
      ? viemClients.getPrivateViemClient(input.chainId)
      : viemClients.getViemClient(input.chainId)
  }

  const getDelegationInfo = (): Promise<DelegationCheckResult> =>
    dependencies.getDelegationDetails(activeAccount.address, input.chainId)

  // Use injected factories for signer creation
  const transactionSigner = input.includesDelegation
    ? dependencies.createBundledDelegationTransactionSignerService({
        getAccount: () => input.account,
        getProvider,
        getViemClient,
        getSignerManager: () => signerManager,
        getDelegationInfo,
      })
    : dependencies.createTransactionSignerService({
        getAccount: () => input.account,
        getProvider,
        getSignerManager: () => signerManager,
      })

  const transactionRepository = dependencies.createTransactionRepository({
    actions: dependencies.transactionActions,
    makeSelectAddressTransactions: dependencies.makeSelectAddressTransactions,
    logger: dependencies.logger,
    runSagaEffect: dependencies.runSagaEffect,
  })

  const analyticsService = dependencies.createAnalyticsService({
    sendAnalyticsEvent: dependencies.sendAnalyticsEvent,
    logger: dependencies.logger,
  })

  const transactionService = dependencies.createTransactionService({
    transactionRepository,
    transactionSigner,
    configService: transactionConfigService,
    analyticsService,
    logger: dependencies.logger,
    getProvider,
  })

  return { transactionSigner, transactionService }
}
