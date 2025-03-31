import { BaseProvider } from '@ethersproject/providers'
import { providers } from 'ethers'
import { call, put, select } from 'typed-redux-saga'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta, AccountType, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, MainnetPrivateRpcConfigKey } from 'uniswap/src/features/gating/configs'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  OnChainTransactionDetails,
  TransactionOptions,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  isBridgeTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
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
  const { chainId, account, options, typeInfo } = params
  let request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${getChainLabel(chainId)} to ${request.to}`)

  if (account.type === AccountType.Readonly) {
    throw new Error('Account must support signing')
  }

  // Register the tx in the store before it's submitted
  const unsubmittedTransaction = yield* call(addUnsubmittedTransaction, params)
  let calculatedNonce: CalculatedNonce | undefined

  try {
    // Only fetch nonce if it's not already set, or we could be overwriting some custom logic
    // On swapSaga we manually set them for approve+swap to prevent errors in some L2s
    if (!request.nonce) {
      calculatedNonce = yield* call(tryGetNonce, account, chainId)
      if (calculatedNonce) {
        request = { ...request, nonce: calculatedNonce.nonce }
      }
    }

    // Sign and send the transaction
    const provider = options.submitViaPrivateRpc
      ? yield* call(getPrivateProvider, chainId, account)
      : yield* call(getProvider, chainId)
    const signerManager = yield* call(getSignerManager)
    const { transactionResponse, populatedRequest, timestampBeforeSend } = yield* call(
      signAndSendTransaction,
      request,
      account,
      provider,
      signerManager,
    )
    logger.debug('sendTransaction', '', 'Tx submitted:', transactionResponse.hash)

    // Update the transaction with the hash and populated request
    yield* call(
      updateSubmittedTransaction,
      unsubmittedTransaction,
      transactionResponse.hash,
      timestampBeforeSend,
      populatedRequest,
      provider,
      params.analytics,
    )
    return { transactionResponse }
  } catch (error) {
    yield* put(transactionActions.finalizeTransaction({ ...unsubmittedTransaction, status: TransactionStatus.Failed }))

    if (error instanceof Error) {
      let errorCategory = 'unknown'
      if (error.message.includes('nonce') || error.message.includes('future transaction tries to replace pending')) {
        errorCategory = 'nonce_error'
      } else if (error.message.includes('Failed in pending block with: Reverted')) {
        errorCategory = 'reverted'
      } else if (
        error.message.includes('intrinsic gas too low') ||
        error.message.includes('max fee per gas less than block base fee') ||
        error.message.includes('transaction underpriced')
      ) {
        errorCategory = 'gas_too_low'
      } else if (error.message.includes('Too Many Requests')) {
        errorCategory = 'rate_limited'
      }

      const logExtra = {
        category: errorCategory,
        chainId,
        transactionType: typeInfo.type,
        calculatedNonce,
        ...options,
      }

      // Log warning for alerting
      logger.warn('sendTransactionSaga', 'sendTransaction', 'RPC Failure', { errorMessage: error.message, ...logExtra })

      // Log error for full error details
      logger.error(error, {
        tags: { file: 'sendTransactionSaga', function: 'sendTransaction' },
        extra: logExtra,
      })

      throw new Error(`Failed to send transaction: ${errorCategory}`, {
        cause: error,
      })
    }

    throw error
  }
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: AccountMeta,
  provider: providers.Provider,
  signerManager: SignerManager,
): Promise<{
  transactionResponse: providers.TransactionResponse
  populatedRequest: providers.TransactionRequest
  timestampBeforeSend: number
}> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const timestampBeforeSend = Date.now()
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest, timestampBeforeSend }
}

function* addUnsubmittedTransaction({
  chainId,
  typeInfo,
  account,
  options,
  txId,
  transactionOriginType,
}: SendTransactionParams) {
  const id = txId ?? createTransactionId()

  const transaction: OnChainTransactionDetails = {
    routing: isBridgeTypeInfo(typeInfo) ? Routing.BRIDGE : Routing.CLASSIC,
    id,
    chainId,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
    },
    transactionOriginType,
  }
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('sendTransaction', 'addUnsubmittedTransaction', 'Tx added:', { chainId, ...typeInfo })
  return transaction
}

export function* updateSubmittedTransaction(
  transaction: OnChainTransactionDetails,
  hash: string,
  timestampBeforeSend: number,
  populatedRequest: providers.TransactionRequest,
  provider: providers.Provider,
  analytics?: ReturnType<typeof getBaseTradeAnalyticsProperties>,
) {
  const timestampAfterSend = Date.now()
  // Get the internal (cached) block number if not older than 1000ms.
  // The block number is fetched when submitting the transaction, so it should be recent.
  const baseProvider = provider as BaseProvider
  const blockNumber = yield* call([baseProvider, baseProvider._getInternalBlockNumber], 1000)
  const currentBlockFetchDelayMs = Date.now() - timestampAfterSend
  const request = getSerializableTransactionRequest(populatedRequest, transaction.chainId)
  const timeoutTimestampMs =
    transaction.typeInfo.gasEstimates || transaction.options.submitViaPrivateRpc
      ? timestampAfterSend + getTransactionTimeoutMs(transaction.chainId)
      : undefined
  const privateRpcProvider =
    provider.constructor.name === 'FlashbotsRpcProvider'
      ? 'flashbots'
      : transaction.options.submitViaPrivateRpc
        ? 'mevblocker'
        : undefined

  const updatedTransaction: OnChainTransactionDetails = {
    ...transaction,
    hash,
    status: TransactionStatus.Pending,
    options: {
      ...transaction.options,
      request,
      rpcSubmissionTimestampMs: timestampAfterSend,
      rpcSubmissionDelayMs: timestampAfterSend - timestampBeforeSend,
      currentBlockFetchDelayMs,
      timeoutTimestampMs,
      privateRpcProvider,
      blockSubmitted: blockNumber,
    },
  }

  if (transaction.typeInfo.type === TransactionType.Swap || transaction.typeInfo.type === TransactionType.Bridge) {
    if (!analytics) {
      // Don't expect swaps from WC or Dapps to always provide analytics object
      if (transaction.transactionOriginType === TransactionOriginType.Internal) {
        logger.error(new Error('Missing `analytics` for swap when calling `addTransaction`'), {
          tags: { file: 'sendTransactionSaga', function: 'addTransaction' },
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
  yield* put(transactionActions.updateTransaction(updatedTransaction))
  logger.debug('sendTransaction', 'updateSubmittedTransaction', 'Tx updated:', {
    chainId: updatedTransaction.chainId,
    ...updatedTransaction.typeInfo,
  })
}

export interface CalculatedNonce {
  nonce: number
  pendingPrivateTxCount?: number
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

    const useFlashbots = getDynamicConfigValue<DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey, boolean>(
      DynamicConfigs.MainnetPrivateRpc,
      MainnetPrivateRpcConfigKey.UseFlashbots,
      false,
    )

    const sendAuthenticationHeader = getDynamicConfigValue<
      DynamicConfigs.MainnetPrivateRpc,
      MainnetPrivateRpcConfigKey,
      boolean
    >(DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey.SendFlashbotsAuthenticationHeader, false)

    const shouldUseFlashbots =
      isPrivateRpcEnabled && chainId === UniverseChainId.Mainnet && useFlashbots && sendAuthenticationHeader

    const provider = shouldUseFlashbots
      ? yield* call(getPrivateProvider, chainId, account)
      : yield* call(getProvider, chainId)

    const nonce = yield* call([provider, provider.getTransactionCount], account.address, 'pending')

    // If we're using Flashbots with authentication header as private RPC, it will already account for pending private transactions. Otherwise, add the local pending private transactions.
    if (!shouldUseFlashbots && isPrivateRpcSupportedOnChain(chainId)) {
      const pendingPrivateTransactionCount = yield* call(getPendingPrivateTxCount, account.address, chainId)
      return {
        nonce: nonce + pendingPrivateTransactionCount,
        pendingPrivateTxCount: pendingPrivateTransactionCount,
      }
    }
    return {
      nonce,
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'sendTransactionSaga', function: 'tryGetNonce' },
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
      Boolean(tx.options.submitViaPrivateRpc) &&
      tx.hash,
  ).length
}
