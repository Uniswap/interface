import '@tamagui/core/reset.css'
import 'src/app/Global.css'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters
import { isDevEnv, isTestEnv } from '@universe/environment'
import { getUniswapServiceUrls } from 'src/app/config'
import { EXTENSION_ORIGIN_APPLICATION } from 'src/app/version'
import { createAnalyticsDebugBridge } from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { logger } from 'utilities/src/logger/logger'
// oxlint-disable-next-line no-restricted-imports -- Direct utilities import required for analytics initialization
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'

export async function initExtensionAnalytics(): Promise<void> {
  if (isTestEnv()) {
    logger.debug('analytics.ts', 'initExtensionAnalytics', 'Skipping Amplitude initialization in test environment')
    return
  }

  const debugBridge = isDevEnv() ? createAnalyticsDebugBridge() : undefined
  const analyticsAllowed = await getAnalyticsAtomDirect(true)
  await analytics.init({
    transportProvider: new ApplicationTransport({
      serverUrl: getUniswapServiceUrls().amplitudeProxyUrl,
      appOrigin: EXTENSION_ORIGIN_APPLICATION,
      debugBridge,
    }),
    allowed: analyticsAllowed,
    userIdGetter: getUniqueId,
    debugBridge,
  })
}
