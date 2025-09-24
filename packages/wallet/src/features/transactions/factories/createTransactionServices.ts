import type { TransactionRequest } from '@ethersproject/providers'
import type { SagaIterator } from 'redux-saga'
import { call, select } from 'typed-redux-saga'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PublicClient } from 'viem'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import type { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type {
  DelegationType,
  TransactionSagaDependencies,
} from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'

export type CreateTransactionServicesResult = {
  transactionSigner: TransactionSigner
  transactionService: TransactionService
}

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
    delegationType: DelegationType
    request?: TransactionRequest
  },
): SagaIterator<CreateTransactionServicesResult> {
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
      ? providerService.getPrivateProvider({
          chainId: input.chainId,
          account: input.account,
        })
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

  const delegationInfo = yield* call(dependencies.getDelegationInfoForTransaction, {
    delegationType: input.delegationType,
    activeAccount,
    chainId: input.chainId,
    transactionRequest: input.request,
    logger: dependencies.logger,
  })

  // Use injected factories for signer creation
  const transactionSigner = delegationInfo.needsDelegation
    ? dependencies.createBundledDelegationTransactionSignerService({
        delegationInfo,
        getAccount: () => input.account,
        getProvider,
        getViemClient,
        getSignerManager: () => signerManager,
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
