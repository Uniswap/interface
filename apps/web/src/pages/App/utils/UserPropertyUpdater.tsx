import { CustomUserProperties, SharedEventName, getBrowser } from '@uniswap/analytics-events'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'
import { useRouterPreference } from 'state/user/hooks'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setUserProperty } from 'uniswap/src/features/telemetry/user'
import { Metric, getCLS, getFCP, getFID, getLCP } from 'web-vitals'

export function UserPropertyUpdater() {
  const isDarkMode = useIsDarkMode()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [routerPreference] = useRouterPreference()
  const rehydrated = useAppSelector((state) => state._persist.rehydrated)

  useEffect(() => {
    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties.
    setUserProperty(CustomUserProperties.USER_AGENT, navigator.userAgent)
    setUserProperty(CustomUserProperties.BROWSER, getBrowser())
    setUserProperty(CustomUserProperties.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    setUserProperty(CustomUserProperties.SCREEN_RESOLUTION_WIDTH, window.screen.width)
    setUserProperty(CustomUserProperties.GIT_COMMIT_HASH, process.env.REACT_APP_GIT_COMMIT_HASH ?? 'unknown')

    // Service Worker analytics
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
    setUserProperty(CustomUserProperties.DARK_MODE, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (!rehydrated) {
      return
    }
    setUserProperty(CustomUserProperties.ROUTER_PREFERENCE, routerPreference)
  }, [routerPreference, rehydrated])

  useEffect(() => {
    setUserProperty(CustomUserProperties.TESTNET_MODE_ENABLED, isTestnetModeEnabled)
  }, [isTestnetModeEnabled])

  return null
}
