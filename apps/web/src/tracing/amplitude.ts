import { OriginApplication } from '@uniswap/analytics'
import store from 'state'
import { setOriginCountry } from 'state/user/reducer'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'

export function setupAmplitude() {
  getAnalyticsAtomDirect(true).then((allowAnalytics) => {
    analytics.init(
      new ApplicationTransport({
        serverUrl: uniswapUrls.amplitudeProxyUrl,
        appOrigin: OriginApplication.INTERFACE,
        reportOriginCountry: (country: string) => store.dispatch(setOriginCountry(country)),
      }),
      allowAnalytics,
      process.env.REACT_APP_GIT_COMMIT_HASH,
    )
  })
}
