import ReactNativeIdfaAaid from '@sparkfabrik/react-native-idfa-aaid'
import { ANONYMOUS_DEVICE_ID, OriginApplication } from '@uniswap/analytics'
import { isAndroid, isTestEnv } from '@universe/environment'
import DeviceInfo from 'react-native-device-info'
import { call, delay, fork, select } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { MobileUserPropertyName } from 'uniswap/src/features/telemetry/user'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { logger } from 'utilities/src/logger/logger'
// oxlint-disable-next-line no-restricted-imports -- Required for analytics initialization
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { watchTransactionEvents } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'

export function* telemetrySaga() {
  if (isTestEnv()) {
    logger.debug('telemetry/saga.ts', 'telemetrySaga', 'Skipping Amplitude initialization in test environment')
  } else {
    yield* delay(1)

    const allowAnalytics = yield* select(selectAllowAnalytics)

    yield* call(analytics.init, {
      transportProvider: new ApplicationTransport({
        serverUrl: uniswapUrls.amplitudeProxyUrl,
        appOrigin: OriginApplication.MOBILE,
        originOverride: uniswapUrls.apiOrigin,
        appBuild: DeviceInfo.getBundleId(),
      }),
      allowed: allowAnalytics,
      userIdGetter: getUniqueId,
    })

    if (isAndroid) {
      // Only need GAID, not using IDFA
      const advertisingInfoResponse = yield* call(ReactNativeIdfaAaid.getAdvertisingInfo)
      const adTrackingAllowed = allowAnalytics && !advertisingInfoResponse.isAdTrackingLimited
      if (adTrackingAllowed) {
        yield* call(
          analytics.setUserProperty,
          MobileUserPropertyName.AdvertisingId,
          advertisingInfoResponse.id ? advertisingInfoResponse.id : ANONYMOUS_DEVICE_ID,
        )
      }
    }
  }

  yield* fork(watchTransactionEvents)
}
