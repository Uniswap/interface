import { OriginApplication } from '@uniswap/analytics'
import DeviceInfo from 'react-native-device-info'
import { selectAllowAnalytics } from 'src/features/telemetry/selectors'
import { call, delay, fork, select, takeEvery } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { transactionActions } from 'wallet/src/features/transactions/slice'
import { logTransactionEvent } from 'wallet/src/features/transactions/transactionWatcherSaga'

export function* telemetrySaga() {
  yield* delay(1)
  const allowAnalytics = yield* select(selectAllowAnalytics)
  yield* call(
    analytics.init,
    new ApplicationTransport(
      uniswapUrls.amplitudeProxyUrl,
      OriginApplication.MOBILE,
      uniswapUrls.apiBaseUrl,
      DeviceInfo.getBundleId()
    ),
    allowAnalytics
  )
  yield* fork(watchTransactionEvents)
}

function* watchTransactionEvents() {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
