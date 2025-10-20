import '@tamagui/core/reset.css'
import 'src/app/Global.css'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import { EXTENSION_ORIGIN_APPLICATION } from 'src/app/version'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
// biome-ignore lint/style/noRestrictedImports: Direct utilities import required for analytics initialization
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'

export async function initExtensionAnalytics(): Promise<void> {
  const analyticsAllowed = await getAnalyticsAtomDirect(true)
  await analytics.init({
    transportProvider: new ApplicationTransport({
      serverUrl: uniswapUrls.amplitudeProxyUrl,
      appOrigin: EXTENSION_ORIGIN_APPLICATION,
    }),
    allowed: analyticsAllowed,
    userIdGetter: getUniqueId,
  })
}
