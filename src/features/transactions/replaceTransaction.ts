import { BigNumber, providers } from 'ethers'
import { CallEffect, PutEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'
import { signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { finalizeTransaction, updateTransaction } from 'src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { getSerializableTransactionRequest } from 'src/features/transactions/utils'
import { selectAccounts } from 'src/features/wallet/selectors'
import { SignerManager } from 'src/features/wallet/signing/SignerManager'
import { getChecksumAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { call, put } from 'typed-redux-saga'

export function* attemptReplaceTransaction(
  transaction: TransactionDetails,
  newTxRequest: providers.TransactionRequest,
  isCancellation = false
): Generator<
  | SelectEffect
  | CallEffect<providers.JsonRpcProvider>
  | CallEffect<SignerManager>
  | CallEffect<{
      transactionResponse: providers.TransactionResponse
      populatedRequest: providers.TransactionRequest
    }>
  | PutEffect<{
      payload: TransactionDetails
      type: string
    }>
  | PutEffect<{
      payload: AppNotification
      type: string
    }>,
  void,
  unknown
> {
  const { chainId, hash, options } = transaction
  logger.debug('replaceTransaction', '', 'Attempting tx replacement', hash)
  try {
    const { from, nonce } = options.request
    if (!from || !nonce || !BigNumber.from(nonce).gte(0)) {
      throw new Error(`Cannot replace invalid transaction: ${hash}`)
    }

    const accounts = yield* appSelect(selectAccounts)
    const account = accounts[getChecksumAddress(from)]
    if (!account) {
      throw new Error(`Cannot replace transaction, account missing: ${hash}`)
    }

    const request: providers.TransactionRequest = {
      ...newTxRequest,
      from,
      nonce,
    }

    const provider = yield* call(getProvider, chainId)
    const signerManager = yield* call(getSignerManager)

    const { transactionResponse, populatedRequest } = yield* call(
      signAndSendTransaction,
      request,
      account,
      provider,
      signerManager
    )
    logger.debug('replaceTransaction', '', 'Tx submitted. New hash:', transactionResponse.hash)

    const updatedTransaction: TransactionDetails = {
      ...transaction,
      hash: transactionResponse.hash,
      status: isCancellation ? TransactionStatus.Cancelling : TransactionStatus.Pending,
      receipt: undefined,
      options: {
        ...options,
        request: getSerializableTransactionRequest(populatedRequest, chainId),
      },
    }
    yield* put(updateTransaction(updatedTransaction))
  } catch (error) {
    logger.error('replaceTransaction', '', 'Error while attempting tx replacement', hash, error)

    // Caught an invalid replacement, which is a failed cancelation attempt. Aka previous
    // txn was already mined. Mark as finalized.
    if (transaction.status === TransactionStatus.Cancelling && isCancellation) {
      const updatedTransaction: TransactionDetails = {
        ...transaction,
        hash,
        status: TransactionStatus.FailedCancel,
        receipt: undefined,
        options: {
          ...options,
        },
      }
      yield* put(
        finalizeTransaction({ ...updatedTransaction, status: TransactionStatus.FailedCancel })
      )
    } else {
      // Finalize and end attempts to replace.
      // TODO: [MOB-3898] Can we check for specific errors here?.  Sometimes this might mark actually succesful result.
      // TODO: [MOB-3898] should we even finalize this?
      yield* put(finalizeTransaction({ ...transaction, status: TransactionStatus.Success }))
    }

    yield* put(
      pushNotification({
        type: AppNotificationType.Error,
        address: transaction.from,
        errorMessage: isCancellation
          ? i18n.t('Unable to cancel transaction')
          : i18n.t('Unable to replace transaction'),
      })
    )
  }
}
