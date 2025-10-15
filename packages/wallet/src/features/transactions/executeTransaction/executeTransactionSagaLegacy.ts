import { BaseProvider } from '@ethersproject/providers'
import { providers } from 'ethers'
import { SagaIterator } from 'redux-saga'
import { call, put } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties, UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  OnChainTransactionDetails,
  TransactionOptions,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { signAndSubmitTransaction } from 'wallet/src/features/transactions/executeTransaction/signAndSubmitTransaction'
import { CalculatedNonce, tryGetNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { createGetUpdatedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createGetUpdatedTransactionDetails'
import { createUnsubmittedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createUnsubmittedTransactionDetails'
import { getRPCErrorCategory } from 'wallet/src/features/transactions/utils'
import {
  getPrivateProvider,
  getPrivateViemClient,
  getProvider,
  getSignerManager,
  getViemClient,
} from 'wallet/src/features/wallet/context'

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
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

export function* executeTransactionLegacy(params: ExecuteTransactionParams): SagaIterator<{
  transactionHash: string
}> {
  const { chainId, account, options, typeInfo } = params
  let request = options.request

  logger.debug('executeTransaction', '', `Sending tx on ${getChainLabel(chainId)} to ${request.to}`)

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

    const viemClient = options.submitViaPrivateRpc
      ? yield* call(getPrivateViemClient, chainId, account)
      : yield* call(getViemClient, chainId)

    const signerManager = yield* call(getSignerManager)

    const { transactionResponse, populatedRequest, timestampBeforeSend, timestampBeforeSign } = yield* call(
      signAndSubmitTransaction,
      {
        request,
        account,
        provider,
        signerManager,
        viemClient,
        isRemoveDelegation: typeInfo.type === TransactionType.RemoveDelegation,
      },
    )
    logger.debug('executeTransaction', '', 'Tx submitted:', transactionResponse.hash)

    // Update the transaction with the hash and populated request
    yield* call(updateSubmittedTransaction, {
      transaction: unsubmittedTransaction,
      hash: transactionResponse.hash,
      timestampBeforeSign,
      timestampBeforeSend,
      populatedRequest,
      provider,
      analytics: params.analytics,
    })

    // Log metric for successfully submitted transactions to datadog for alerting %
    logger.info('sendTransactionSaga', 'sendTransaction', 'Transaction successfully submitted', {
      chainLabel: getChainLabel(chainId),
      transactionType: typeInfo.type,
      hash: transactionResponse.hash,
    })

    return { transactionHash: transactionResponse.hash }
  } catch (error) {
    yield* put(transactionActions.finalizeTransaction({ ...unsubmittedTransaction, status: TransactionStatus.Failed }))

    if (error instanceof Error) {
      const errorCategory = getRPCErrorCategory(error)

      const logExtra = {
        category: errorCategory,
        chainId,
        transactionType: typeInfo.type,
        calculatedNonce,
        ...options,
      }

      // Log warning for alerting for datadog metrics
      logger.warn('executeTransactionSaga', 'executeTransaction', 'RPC Failure', {
        errorMessage: error.message,
        ...logExtra,
      })

      // Log error for full error details to RUM
      logger.error(error, {
        tags: { file: 'executeTransactionSaga', function: 'executeTransaction' },
        extra: logExtra,
      })

      throw new Error(`Failed to send transaction: ${errorCategory}`, {
        cause: error,
      })
    }

    throw error
  }
}

function* addUnsubmittedTransaction(
  executeTransactionParams: ExecuteTransactionParams,
): SagaIterator<OnChainTransactionDetails> {
  const transaction = createUnsubmittedTransactionDetails(executeTransactionParams)
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('executeTransaction', 'addUnsubmittedTransaction', 'Tx added:', {
    chainId: transaction.chainId,
    ...transaction.typeInfo,
  })
  return transaction
}

function* updateSubmittedTransaction({
  transaction,
  hash,
  timestampBeforeSign,
  timestampBeforeSend,
  populatedRequest,
  provider,
  analytics,
}: {
  transaction: OnChainTransactionDetails
  hash: string
  timestampBeforeSign: number
  timestampBeforeSend: number
  populatedRequest: providers.TransactionRequest
  provider: providers.Provider
  analytics?: SwapTradeBaseProperties
}): SagaIterator<void> {
  // Get the internal (cached) block number if not older than 1000ms.
  // The block number is fetched when submitting the transaction, so it should be recent.
  const baseProvider = provider as BaseProvider
  const getBlockNumber = async (): Promise<number> => baseProvider._getInternalBlockNumber(1000)

  const getUpdatedTransactionDetails = createGetUpdatedTransactionDetails({
    getBlockNumber,
    isPrivateRpc: provider.constructor.name === 'FlashbotsRpcProvider',
  })

  const updatedTransaction = yield* call(getUpdatedTransactionDetails, {
    transaction,
    hash,
    timestampBeforeSign,
    timestampBeforeSend,
    populatedRequest,
  })

  if (transaction.typeInfo.type === TransactionType.Swap || transaction.typeInfo.type === TransactionType.Bridge) {
    if (!analytics) {
      // Don't expect swaps from WC or Dapps to always provide analytics object
      if (transaction.transactionOriginType === TransactionOriginType.Internal) {
        logger.error(new Error('Missing `analytics` for swap when calling `addTransaction`'), {
          tags: { file: 'executeTransactionSaga', function: 'addTransaction' },
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
  logger.debug('executeTransaction', 'updateSubmittedTransaction', 'Tx updated:', {
    chainId: updatedTransaction.chainId,
    ...updatedTransaction.typeInfo,
  })
}
