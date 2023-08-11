import { call } from 'typed-redux-saga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import { makeSelectTransaction } from 'wallet/src/features/transactions/selectors'
import { TransactionDetails } from 'wallet/src/features/transactions/types'
import { appSelect } from 'wallet/src/state'

// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(transaction: TransactionDetails) {
  const { from, chainId, id } = transaction
  const tx = yield* appSelect(makeSelectTransaction(from, chainId, id))
  if (!tx?.cancelRequest) {
    throw new Error('attempted to cancel a transaction without cancelRequest set')
  }
  yield* call(attemptReplaceTransaction, transaction, tx.cancelRequest, true)
}
