import { CallEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransaction'
import { makeSelectTransaction } from 'src/features/transactions/selectors'
import { TransactionDetails } from 'src/features/transactions/types'
import { call } from 'typed-redux-saga'

// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(
  transaction: TransactionDetails
): Generator<SelectEffect | CallEffect<void>, void, unknown> {
  const { from, chainId, id } = transaction
  // get updated TransactionDetails object to query for cancelRequest
  // TODO(MOB-3968): Add more specific type definition here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx: any = yield* appSelect(makeSelectTransaction(from, chainId, id))
  if (!tx?.cancelRequest) {
    throw new Error('attempted to cancel a transaction without cancelRequest set')
  }
  yield* call(attemptReplaceTransaction, transaction, tx.cancelRequest, true)
}
