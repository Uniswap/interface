import { OriginApplication } from '@uniswap/analytics'
import DeviceInfo from 'react-native-device-info'
import { call, fork, takeEvery } from 'typed-redux-saga'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { transactionActions } from 'wallet/src/features/transactions/slice'
import { logTransactionEvent } from 'wallet/src/features/transactions/transactionWatcherSaga'

export function* telemetrySaga() {
  yield* call(
    analytics.init,
    new ApplicationTransport(
      uniswapUrls.amplitudeProxyUrl,
      OriginApplication.MOBILE,
      uniswapUrls.apiBaseUrl,
      DeviceInfo.getBundleId()
    )
  )
  yield* fork(watchTransactionEvents)
}

function* watchTransactionEvents() {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
