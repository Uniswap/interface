import { BigNumber, providers } from 'ethers'
import { appSelect } from 'src/app/hooks'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { NotificationSeverity } from 'src/features/notifications/types'
import { signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { updateTransaction } from 'src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { getSerializableTransactionRequest } from 'src/features/transactions/utils'
import { accountsSelector } from 'src/features/wallet/walletSlice'
import { normalizeAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { assert } from 'src/utils/validation'
import { call, put } from 'typed-redux-saga'

export function* attemptReplaceTransaction(
  transaction: TransactionDetails,
  newTxRequest: providers.TransactionRequest,
  isCancellation = false
) {
  const { chainId, hash, options } = transaction
  logger.debug('replaceTransaction', '', 'Attempting tx replacement', hash)
  try {
    const { from, nonce } = options.request
    assert(
      from && nonce && BigNumber.from(nonce).gte(0),
      `Cannot replace invalid transaction: ${hash}`
    )

    const accounts = yield* appSelect(accountsSelector)
    const account = accounts[normalizeAddress(from)]
    assert(account, `Cannot replace transaction, account missing: ${hash}`)

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
      // Note: currently the replaced tx status is reverted to pending
      // We may eventually want a special status (or a status history) to
      // show that the tx was previously cancelled/replaced.
      status: TransactionStatus.Pending,
      receipt: undefined,
      options: {
        ...options,
        request: getSerializableTransactionRequest(populatedRequest, chainId),
      },
    }
    yield* put(updateTransaction(updatedTransaction))
  } catch (error) {
    logger.error('replaceTransaction', '', 'Error while attempting tx replacement', hash, error)
    yield* put(
      pushNotification({
        message: `Unable to ${isCancellation ? 'cancel' : 'replace'} transaction`,
        severity: NotificationSeverity.Error,
      })
    )
  }
}
