import { initAnalytics } from 'src/features/telemetry'
import { transactionActions } from 'src/features/transactions/slice'
import { logTransactionEvent } from 'src/features/transactions/transactionWatcherSaga'
import { call, fork, takeEvery } from 'typed-redux-saga'

export function* telemetrySaga() {
  yield* call(initAnalytics)
  yield* fork(watchTransactionEvents)
}

function* watchTransactionEvents() {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
