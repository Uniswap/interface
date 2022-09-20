import { appSelect } from 'src/app/hooks'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransaction'
import { makeSelectTransaction } from 'src/features/transactions/selectors'
import { hexlifyTransaction } from 'src/features/transactions/transfer/transferTokenSaga'
import { TransactionDetails } from 'src/features/transactions/types'
import { call } from 'typed-redux-saga'

// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(transaction: TransactionDetails) {
  const { from, chainId, id } = transaction
  // get updated TransactionDetails object to query for cancelRequest
  const tx = yield* appSelect(makeSelectTransaction(from, chainId, id))
  if (!tx?.cancelRequest) {
    throw new Error('attempted to cancel a transaction without cancelRequest set')
  }
  yield* call(attemptReplaceTransaction, transaction, hexlifyTransaction(tx.cancelRequest), true)
}
