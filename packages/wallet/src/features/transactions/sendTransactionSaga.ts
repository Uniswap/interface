import { providers } from 'ethers'
import { call, put, select } from 'typed-redux-saga'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta, AccountType, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  isBridgeTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { getSerializableTransactionRequest } from 'wallet/src/features/transactions/utils'
import { getPrivateProvider, getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'

// This timeout is used to trigger a log event if the transaction is pending for too long
const getTransactionTimeoutMs = (chainId: UniverseChainId) => {
  if (chainId === UniverseChainId.Mainnet) {
    return 10 * ONE_MINUTE_MS
  }
  return ONE_MINUTE_MS
}

export interface SendTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: UniverseChainId
  account: AccountMeta
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  transactionOriginType: TransactionOriginType
  analytics?: ReturnType<typeof getBaseTradeAnalyticsProperties>
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

export function* sendTransaction(params: SendTransactionParams) {
  const { chainId, account, options } = params
  let request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${UNIVERSE_CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) {
    throw new Error('Account must support signing')
  }

  // Only fetch nonce if it's not already set, or we could be overwriting some custom logic
  // On swapSaga we manually set them for approve+swap to prevent errors in some L2s
  if (!request.nonce) {
    const nonce = yield* call(tryGetNonce, account, chainId)
    if (nonce) {
      request = { ...request, nonce }
    }
  }

  // Sign and send the transaction
  const provider = options.submitViaPrivateRpc
    ? yield* call(getPrivateProvider, chainId, account)
    : yield* call(getProvider, chainId)
  const signerManager = yield* call(getSignerManager)
  const { transactionResponse, populatedRequest } = yield* call(
    signAndSendTransaction,
    request,
    account,
    provider,
    signerManager,
  )
  logger.debug('sendTransaction', '', 'Tx submitted:', transactionResponse.hash)

  const { gasEstimates } = params.typeInfo
  if (gasEstimates) {
    const blockNumber = yield* call([provider, provider.getBlockNumber])
    gasEstimates.blockSubmitted = blockNumber
  }

  // Register the tx in the store
  yield* call(addTransaction, params, transactionResponse.hash, populatedRequest)
  return { transactionResponse }
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: AccountMeta,
  provider: providers.Provider,
  signerManager: SignerManager,
): Promise<{
  transactionResponse: providers.TransactionResponse
  populatedRequest: providers.TransactionRequest
}> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

function* addTransaction(
  { chainId, typeInfo, account, options, txId, analytics, transactionOriginType }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest,
) {
  const id = txId ?? createTransactionId()
  const request = getSerializableTransactionRequest(populatedRequest, chainId)
  const timeoutTimestampMs = typeInfo.gasEstimates ? Date.now() + getTransactionTimeoutMs(chainId) : undefined

  const transaction: TransactionDetails = {
    routing: isBridgeTypeInfo(typeInfo) ? Routing.BRIDGE : Routing.CLASSIC,
    id,
    chainId,
    hash,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
      request,
      timeoutTimestampMs,
    },
    transactionOriginType,
  }

  if (transaction.typeInfo.type === TransactionType.Swap || transaction.typeInfo.type === TransactionType.Bridge) {
    if (!analytics) {
      // Don't expect swaps from WC or Dapps to always provide analytics object
      if (transactionOriginType === TransactionOriginType.Internal) {
        logger.error(new Error('Missing `analytics` for swap when calling `addTransaction`'), {
          tags: { file: 'sendTransaction', function: 'addTransaction' },
          extra: { transaction },
        })
      }
    } else {
      const event: UniverseEventProperties[WalletEventName.SwapSubmitted] = {
        transaction_hash: hash,
        ...analytics,
      }
      yield* call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, event)
    }
  }
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('sendTransaction', 'addTransaction', 'Tx added:', { chainId, ...typeInfo })
}

/**
 * Attempts to fetch the next nonce to be used for a transaction.
 * If the chain supports private RPC, it will use the private RPC provider, in order to account for pending private transactions.
 *
 * @param account - The account to fetch the nonce for.
 * @param chainId - The chain ID to fetch the nonce for.
 * @returns The nonce if it was successfully fetched, otherwise undefined.
 */
export function* tryGetNonce(account: SignerMnemonicAccountMeta, chainId: UniverseChainId) {
  try {
    const isPrivateRpcEnabled = Statsig.checkGate(getFeatureFlagName(FeatureFlags.PrivateRpc))
    const shouldUseFlashbots =
      isPrivateRpcEnabled &&
      chainId === UniverseChainId.Mainnet &&
      Statsig.checkGate(getFeatureFlagName(FeatureFlags.FlashbotsPrivateRpc))

    const provider = shouldUseFlashbots
      ? yield* call(getPrivateProvider, chainId, account)
      : yield* call(getProvider, chainId)

    const nonce = yield* call([provider, provider.getTransactionCount], account.address, 'pending')

    if (!shouldUseFlashbots && isPrivateRpcSupportedOnChain(chainId)) {
      // If we're using flashbots as private RPC, it will already account for pending private transactions.
      // Only need to add the `pendingPrivateTransactionCount` when there could be transactions submitted via MEVBlocker.
      const pendingPrivateTransactionCount = yield* call(getPendingPrivateTxCount, account.address, chainId)
      return nonce + pendingPrivateTransactionCount
    }
    return nonce
  } catch (error) {
    logger.error(error, {
      tags: { file: 'sendTransaction', function: 'tryGetNonce' },
    })
    return undefined
  }
}

export function* getPendingPrivateTxCount(address: Address, chainId: number) {
  const selectAddressTransactions = yield* call(makeSelectAddressTransactions)
  const pendingTransactions = yield* select(selectAddressTransactions, address)
  if (!pendingTransactions) {
    return 0
  }

  return pendingTransactions.filter(
    (tx) =>
      tx.chainId === chainId &&
      tx.status === TransactionStatus.Pending &&
      isClassic(tx) &&
      Boolean(tx.options.submitViaPrivateRpc),
  ).length
}
