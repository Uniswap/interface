// eslint-disable-next-line no-restricted-imports
import { OriginApplication } from '@uniswap/analytics'
import DeviceInfo, { getUniqueId } from 'react-native-device-info'
import { call, delay, fork, select } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
// eslint-disable-next-line no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { watchTransactionEvents } from 'wallet/src/features/transactions/transactionWatcherSaga'

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
    async () => getUniqueId(),
  )
  yield* fork(watchTransactionEvents)
}
