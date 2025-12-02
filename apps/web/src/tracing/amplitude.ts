import { OriginApplication } from '@uniswap/analytics'
import store from 'state'
import { setOriginCountry } from 'state/user/reducer'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
// biome-ignore lint/style/noRestrictedImports: Need direct analytics import for Amplitude initialization
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'

export function setupAmplitude() {
  getAnalyticsAtomDirect(true).then((allowAnalytics) => {
    analytics.init({
      transportProvider: new ApplicationTransport({
        serverUrl: uniswapUrls.amplitudeProxyUrl,
        appOrigin: OriginApplication.INTERFACE,
        reportOriginCountry: (country: string) => store.dispatch(setOriginCountry(country)),
      }),
      allowed: allowAnalytics,
      initHash: process.env.REACT_APP_GIT_COMMIT_HASH,
    })
  })
}
