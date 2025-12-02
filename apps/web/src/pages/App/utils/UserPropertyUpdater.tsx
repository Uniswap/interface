import { queryOptions, useQuery } from '@tanstack/react-query'
import { getBrowser, SharedEventName } from '@uniswap/analytics-events'
import { provideUniswapIdentifierService } from '@universe/api'
import { UniswapIdentifierService } from '@universe/sessions'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'
import { useRouterPreference } from 'state/user/hooks'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

/**
 * Query options for fetching the Uniswap identifier
 */
function getUniswapIdentifierQueryOptions(getService: () => UniswapIdentifierService) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.UniqueId],
    queryFn: async () => {
      return getService().getUniswapIdentifier()
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function UserPropertyUpdater() {
  const isDarkMode = useIsDarkMode()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [routerPreference] = useRouterPreference()
  const rehydrated = useAppSelector((state) => state._persist.rehydrated)

  const { data: uniswapIdentifier } = useQuery(getUniswapIdentifierQueryOptions(provideUniswapIdentifierService))
  useEffect(() => {
    if (uniswapIdentifier) {
      setUserProperty(InterfaceUserPropertyName.UniswapIdentifier, uniswapIdentifier)
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
