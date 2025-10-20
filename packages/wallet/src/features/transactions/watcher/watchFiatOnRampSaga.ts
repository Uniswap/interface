import { call, delay, put, race, select, take } from 'typed-redux-saga'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { forceFetchFiatOnRampTransactions, upsertFiatOnRampTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { fetchFORTransaction } from 'wallet/src/features/fiatOnRamp/api'
import { deleteTransaction } from 'wallet/src/features/transactions/watcher/transactionSagaUtils'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export function* watchFiatOnRampTransaction(transaction: FORTransactionDetails): Generator<unknown> {
  const { id } = transaction
  let forceFetch = false

  logger.debug('watchFiatOnRampSaga', 'watchFiatOnRampTransaction', 'Watching for updates for fiat onramp tx:', id)

  try {
    while (true) {
      const activeAddress = yield* select(selectActiveAccountAddress)
      const updatedTransaction = yield* call(fetchFORTransaction, {
        previousTransactionDetails: transaction,
        forceFetch,
        activeAccountAddress: activeAddress,
      })

      forceFetch = false
      // We've got an invalid response from backend
      if (!updatedTransaction) {
        return
      }

      // Stale transaction, never found on backend
      if (updatedTransaction.status === TransactionStatus.Unknown) {
        yield* call(deleteTransaction, transaction)
        return // stop polling
      }

      // Transaction has been found
      if (
        updatedTransaction.typeInfo.type !== TransactionType.LocalOnRamp &&
        updatedTransaction.typeInfo.type !== TransactionType.LocalOffRamp
      ) {
        logger.debug(
          'watchFiatOnRampSaga',
          'watchFiatOnRampTransaction',
          `Updating transaction with id ${id} from status ${transaction.status} to ${updatedTransaction.status}`,
        )
      }

      // Update transaction
      yield* put(upsertFiatOnRampTransaction(updatedTransaction))

      // Finished transaction
      if (
        updatedTransaction.status === TransactionStatus.Failed ||
        updatedTransaction.status === TransactionStatus.Success
      ) {
        // Show notification badge
        yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
        return // stop polling
      }

      // at this point, we received a response from backend
      // however, we didn't have enough information to act
      // try again after a waiting period or when we've come back WebView
      const raceResult = yield* race({
        forceFetch: take(forceFetchFiatOnRampTransactions),
        timeout: delay(PollingInterval.Fast),
      })

      if (raceResult.forceFetch) {
        forceFetch = true
      }
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'watchFiatOnRampSaga', function: 'watchFiatOnRampTransaction' },
    })
  }
}
