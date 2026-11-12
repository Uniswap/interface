import { useQuery } from '@tanstack/react-query'
import { getBrowser, SharedEventName } from '@uniswap/analytics-events'
import { provideUniswapIdentifierService } from '@universe/api'
import { Platform } from '@universe/chains'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { uniswapIdentifierQuery } from '@universe/sessions'
import { useEffect } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSyncStatsigUserIdentifiers } from 'uniswap/src/features/gating/useSyncStatsigUserIdentifiers'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { Metric, onCLS, onFCP, onINP, onLCP } from 'web-vitals'
import { readEntryChunkCacheStatus } from '~/app/bootstrap/entryChunkCacheStatus'
import { getConfig } from '~/config'
import { useActiveAddress } from '~/connection/accounts/hooks'
import { useAppSelector } from '~/state/hooks'
import { useRouterPreference } from '~/state/user/hooks'
import { getIframeParentOriginUserProperty } from '~/utils/getIframeParentOrigin'
import { isIFramed } from '~/utils/isIFramed'

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
    }
  }, [uniswapIdentifier])

  useEffect(() => {
    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties. This relies on
    // setUserProperty enqueueing its $identify synchronously (see analytics.web.ts).
    setUserProperty(InterfaceUserPropertyName.UserAgent, navigator.userAgent)
    setUserProperty(InterfaceUserPropertyName.Browser, getBrowser())
    setUserProperty(InterfaceUserPropertyName.ScreenResolutionHeight, window.screen.height)
    setUserProperty(InterfaceUserPropertyName.ScreenResolutionWidth, window.screen.width)
    setUserProperty(InterfaceUserPropertyName.GitCommitHash, getConfig().gitCommitHash || 'unknown')
    // Computed once and shared with the APP_LOADED event below.
    const isIframed = isIFramed()
    const iframeParentOrigin = getIframeParentOriginUserProperty()
    setUserProperty(InterfaceUserPropertyName.IsIframed, isIframed)
    // Always written: user properties persist on the profile, so a direct load must
    // overwrite the origin left by an earlier framed load rather than keep it.
    setUserProperty(InterfaceUserPropertyName.IframeParentOrigin, iframeParentOrigin)

    // Service Worker analytics
    // This null check is necessary to avoid a crash on mobile browsers like Safari.
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    const isServiceWorkerInstalled = Boolean(window.navigator.serviceWorker?.controller)
    const serviceWorkerProperty = isServiceWorkerInstalled ? 'installed' : 'uninstalled'

    const cache = readEntryChunkCacheStatus()

    const pageLoadProperties = { service_worker: serviceWorkerProperty, cache }
    // User properties are last-write-wins on the profile; the event properties give a
    // per-load record of the embed context so each session can be classified embedded vs direct.
    sendAnalyticsEvent(SharedEventName.APP_LOADED, {
      ...pageLoadProperties,
      is_iframed: isIframed,
      iframe_parent_origin: iframeParentOrigin,
    })
    const sendWebVital =
      (metric: string) =>
      ({ delta }: Metric) =>
        sendAnalyticsEvent(SharedEventName.WEB_VITALS, { ...pageLoadProperties, [metric]: delta })
    onCLS(sendWebVital('cumulative_layout_shift'))
    onFCP(sendWebVital('first_contentful_paint_ms'))
    onINP(sendWebVital('interaction_to_next_paint_ms'))
    onLCP(sendWebVital('largest_contentful_paint_ms'))
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
