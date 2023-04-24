import { BigNumber, providers } from 'ethers'
import { CallEffect, PutEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'
import { signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { addTransaction, deleteTransaction } from 'src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import {
  createTransactionId,
  getSerializableTransactionRequest,
} from 'src/features/transactions/utils'
import { selectAccounts } from 'src/features/wallet/selectors'
import { SignerManager } from 'src/features/wallet/signing/SignerManager'
import { getValidAddress } from 'src/utils/addresses'
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
      payload: { address: string }
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
  const replacementTxnId = createTransactionId()

  try {
    const { from, nonce } = options.request
    if (!from || !nonce || !BigNumber.from(nonce).gte(0)) {
      throw new Error(`Cannot replace invalid transaction: ${hash}`)
    }

    const accounts = yield* appSelect(selectAccounts)
    const checksummedAddress = getValidAddress(from, true, false)
    if (!checksummedAddress) {
      throw new Error(`Cannot replace transaction, address is invalid: ${checksummedAddress}`)
    }
    const account = accounts[checksummedAddress]
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

    const replacementTransaction: TransactionDetails = {
      ...transaction,
      // Ensure we create a new, unique txn to monitor
      id: replacementTxnId,
      hash: transactionResponse.hash,
      status: isCancellation ? TransactionStatus.Cancelling : TransactionStatus.Pending,
      receipt: undefined,
      addedTime: Date.now(), // update timestamp to now
      options: {
        ...options,
        request: getSerializableTransactionRequest(populatedRequest, chainId),
      },
    }

    // Add new transaction for monitoring after submitting on chain
    yield* put(addTransaction(replacementTransaction))
  } catch (error) {
    logger.error('replaceTransaction', '', 'Error while attempting tx replacement', hash, error)

    // Unable to submit txn on chain, delete from state. This can sometimes be the case where we
    // attempt to replace a txn that has already been mined. Delete new txn in case it was added
    yield* put(
      deleteTransaction({
        address: transaction.from,
        id: replacementTxnId,
        chainId: transaction.chainId,
      })
    )

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
