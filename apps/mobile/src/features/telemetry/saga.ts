import { transactionActions } from 'src/features/transactions/slice'
import { logTransactionEvent } from 'src/features/transactions/transactionWatcherSaga'
import { call, fork, takeEvery } from 'typed-redux-saga'
import { analytics } from 'wallet/src/features/telemetry/analytics/analytics'

export function* telemetrySaga() {
  yield* call(analytics.init)
  yield* fork(watchTransactionEvents)
}

function* watchTransactionEvents() {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
