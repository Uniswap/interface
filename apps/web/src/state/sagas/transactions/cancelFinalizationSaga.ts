import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { put, select, takeEvery } from 'typed-redux-saga'
import { getCancelTxFinalizationUpdates } from 'uniswap/src/features/transactions/cancel/getCancelTxFinalizationUpdates'
import { finalizeTransaction, TransactionsState } from 'uniswap/src/features/transactions/slice'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Flips UniswapX orders when their tracked cancel tx finalizes (pure core in
 * getCancelTxFinalizationUpdates).
 *
 * A saga (not a hook) because `finalizeTransaction` is dispatched from four web sites —
 * the activity updater, useHandleUniswapXActivityUpdate, the merge hook's auto-finalize,
 * and the context-menu "Clear" — and only a store-level listener covers them all.
 */
export function* cancelFinalizationSaga() {
  yield* takeEvery(finalizeTransaction.type, handleCancelTxFinalized)
}

export function* handleCancelTxFinalized(action: ReturnType<typeof finalizeTransaction>) {
  if (action.payload.typeInfo.type !== TransactionType.UniswapXCancel) {
    return
  }
  if (!getFeatureFlag(FeatureFlags.LimitCancelTimeout)) {
    return
  }

  const transactionsState = yield* select((state: { transactions: TransactionsState }) => state.transactions)
  const updates = getCancelTxFinalizationUpdates({
    transaction: action.payload,
    transactionsState,
    nowMs: Date.now(),
  })
  for (const update of updates) {
    yield* put(update)
  }
}
