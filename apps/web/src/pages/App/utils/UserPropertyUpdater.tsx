import { datadogRum } from '@datadog/browser-rum'
import { useQuery } from '@tanstack/react-query'
import { getBrowser, SharedEventName } from '@uniswap/analytics-events'
import { provideUniswapIdentifierService } from '@universe/api'
import { uniswapIdentifierQuery } from '@universe/sessions'
import { useEffect } from 'react'
import { useIsDarkMode } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSyncStatsigUserIdentifiers } from 'uniswap/src/features/gating/useSyncStatsigUserIdentifiers'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useAppSelector } from '~/state/hooks'
import { useRouterPreference } from '~/state/user/hooks'

export function UserPropertyUpdater() {
  const isDarkMode = useIsDarkMode()
  const { isTestnetModeEnabled } = useEnabledChains()
  const address = useActiveAddress(Platform.EVM)

  const [routerPreference] = useRouterPreference()
  const rehydrated = useAppSelector((state) => state._persist.rehydrated)

  const { data: uniswapIdentifier } = useQuery(uniswapIdentifierQuery(provideUniswapIdentifierService))

  // Update Statsig user with address and uniswap_identifier for experiment targeting
  useSyncStatsigUserIdentifiers({
    address,
    uniswapIdentifier,
  })

  useEffect(() => {
    if (uniswapIdentifier) {
      setUserProperty(InterfaceUserPropertyName.UniswapIdentifier, uniswapIdentifier)
      datadogRum.setUserProperty(InterfaceUserPropertyName.UniswapIdentifier, uniswapIdentifier)
    }
  }, [uniswapIdentifier])

  useEffect(() => {
    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties.
    setUserProperty(InterfaceUserPropertyName.UserAgent, navigator.userAgent)
    setUserProperty(InterfaceUserPropertyName.Browser, getBrowser())
    setUserProperty(InterfaceUserPropertyName.ScreenResolutionHeight, window.screen.height)
    setUserProperty(InterfaceUserPropertyName.ScreenResolutionWidth, window.screen.width)
    setUserProperty(InterfaceUserPropertyName.GitCommitHash, process.env.REACT_APP_GIT_COMMIT_HASH ?? 'unknown')

    // Service Worker analytics
    // This null check is necessary to avoid a crash on mobile browsers like Safari.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const isServiceWorkerInstalled = Boolean(window.navigator.serviceWorker?.controller)
    const serviceWorkerProperty = isServiceWorkerInstalled ? 'installed' : 'uninstalled'

    let cache = 'unknown'
    try {
      const timing = performance
        .getEntriesByType('resource')
        .find((timing) => timing.name.match(/\/static\/js\/main\.\w{8}\.js$/)) as PerformanceResourceTiming
      if (timing.transferSize === 0) {
        cache = 'hit'
      } else {
        cache = 'miss'
      }
    } catch {
      // ignore
    }

    const pageLoadProperties = { service_worker: serviceWorkerProperty, cache }
    sendAnalyticsEvent(SharedEventName.APP_LOADED, pageLoadProperties)
    const sendWebVital =
      (metric: string) =>
      ({ delta }: Metric) =>
        sendAnalyticsEvent(SharedEventName.WEB_VITALS, { ...pageLoadProperties, [metric]: delta })
    getCLS(sendWebVital('cumulative_layout_shift'))
    getFCP(sendWebVital('first_contentful_paint_ms'))
    getFID(sendWebVital('first_input_delay_ms'))
    getLCP(sendWebVital('largest_contentful_paint_ms'))
  }, [])

  useEffect(() => {
    setUserProperty(InterfaceUserPropertyName.DarkMode, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (!rehydrated) {
      return
    }
    setUserProperty(InterfaceUserPropertyName.RouterPreference, routerPreference)
  }, [routerPreference, rehydrated])

  useEffect(() => {
    setUserProperty(InterfaceUserPropertyName.TestnetModeEnabled, isTestnetModeEnabled)
  }, [isTestnetModeEnabled])

  return null
}
