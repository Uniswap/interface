import { OriginApplication } from '@uniswap/analytics'
import { isDevEnv, isE2eTestEnv, isTestEnv } from '@universe/environment'
import { createAnalyticsDebugBridge } from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'
import { logger } from 'utilities/src/logger/logger'
// oxlint-disable-next-line no-restricted-imports -- Need direct analytics import for Amplitude initialization
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { getConfig, getUniswapServiceUrls } from '~/config'
import store from '~/state'
import { setOriginCountry } from '~/state/user/reducer'

export function setupAmplitude() {
  if (isTestEnv() && !isE2eTestEnv()) {
    // Want to skip Amplitude initialization in test envs
    // But not in playwright, since we have a Playwright fixture that intercepts Amplitude events
    logger.debug('amplitude.ts', 'setupAmplitude', 'Skipping Amplitude initialization in test environment')
    return
  }

  const debugBridge = isDevEnv() ? createAnalyticsDebugBridge() : undefined

  getAnalyticsAtomDirect(true).then((allowAnalytics) => {
    analytics.init({
      transportProvider: new ApplicationTransport({
        serverUrl: getUniswapServiceUrls().amplitudeProxyUrl,
        appOrigin: OriginApplication.INTERFACE,
        reportOriginCountry: (country: string) => store.dispatch(setOriginCountry(country)),
        debugBridge,
      }),
      allowed: allowAnalytics,
      initHash: getConfig().gitCommitHash,
      debugBridge,
    })
  })
}
