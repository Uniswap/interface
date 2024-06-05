// eslint-disable-next-line no-restricted-imports
import { OriginApplication } from '@uniswap/analytics'
import DeviceInfo, { getDeviceId } from 'react-native-device-info'
import { selectAllowAnalytics } from 'src/features/telemetry/selectors'
import { call, delay, fork, select, takeEvery } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
// eslint-disable-next-line no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { transactionActions } from 'wallet/src/features/transactions/slice'
import { logTransactionEvent } from 'wallet/src/features/transactions/transactionWatcherSaga'

export function* telemetrySaga() {
  yield* delay(1)
  const allowAnalytics = yield* select(selectAllowAnalytics)
  yield* call(
    analytics.init,
    new ApplicationTransport({
      serverUrl: uniswapUrls.amplitudeProxyUrl,
      appOrigin: OriginApplication.MOBILE,
      originOverride: uniswapUrls.apiOrigin,
      appBuild: DeviceInfo.getBundleId(),
    }),
    allowAnalytics,
    undefined,
    async () => getDeviceId()
  )
  yield* fork(watchTransactionEvents)
}

function* watchTransactionEvents() {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
