import { CustomUserProperties, getBrowser, SharedEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { getDeviceId, sendAnalyticsEvent, sendInitializationEvent, Trace, user } from 'analytics'
import ErrorBoundary from 'components/ErrorBoundary'
import Loader from 'components/Icons/LoadingSpinner'
import NavBar, { PageTabs } from 'components/NavBar'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import { useAtom } from 'jotai'
import { useBag } from 'nft/hooks/useBag'
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { useRouterPreference } from 'state/user/hooks'
import { StatsigProvider, StatsigUser } from 'statsig-react'
import styled from 'styled-components'
import DarkModeQueryParamReader from 'theme/components/DarkModeQueryParamReader'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'
import { STATSIG_DUMMY_KEY } from 'tracing'
import { getEnvName } from 'utils/env'
import { getDownloadAppLink } from 'utils/openDownloadApp'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import { RouteDefinition, routes, useRouterConfig } from './RouteDefinitions'

const AppChrome = lazy(() => import('./AppChrome'))

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  padding: ${({ theme }) => theme.navHeight}px 0px 5rem 0px;
  align-items: center;
  flex: 1;
`

const MobileBottomBar = styled.div`
  z-index: ${Z_INDEX.sticky};
  position: fixed;
  display: flex;
  bottom: 0;
  right: 0;
  left: 0;
  width: calc(100vw - 16px);
  justify-content: space-between;
  padding: 0px 4px;
  height: ${({ theme }) => theme.mobileBottomBarHeight}px;
  background: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  margin: 8px;
  border-radius: 20px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    display: none;
  }
`

const HeaderWrapper = styled.div<{ transparent?: boolean }>`
  ${flexRowNoWrap};
  background-color: ${({ theme, transparent }) => !transparent && theme.surface1};
  border-bottom: ${({ theme, transparent }) => !transparent && `1px solid ${theme.surface3}`};
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.dropdown};
`

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()
  const [, setShouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)

  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(pathname)
  const isDarkMode = useIsDarkMode()
  const [routerPreference] = useRouterPreference()
  const [scrolledState, setScrolledState] = useState(false)

  const routerConfig = useRouterConfig()

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrolledState(false)
  }, [pathname])

  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('disableNFTs') === 'true') {
      setShouldDisableNFTRoutes(true)
    } else if (searchParams.get('disableNFTs') === 'false') {
      setShouldDisableNFTRoutes(false)
    }
  }, [searchParams, setShouldDisableNFTRoutes])

  useEffect(() => {
    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties.
    user.set(CustomUserProperties.USER_AGENT, navigator.userAgent)
    user.set(CustomUserProperties.BROWSER, getBrowser())
    user.set(CustomUserProperties.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    user.set(CustomUserProperties.SCREEN_RESOLUTION_WIDTH, window.screen.width)
    user.set(CustomUserProperties.GIT_COMMIT_HASH, process.env.REACT_APP_GIT_COMMIT_HASH ?? 'unknown')

    // Service Worker analytics
    const isServiceWorkerInstalled = Boolean(window.navigator.serviceWorker?.controller)
    const isServiceWorkerHit = Boolean((window as any).__isDocumentCached)
    const serviceWorkerProperty = isServiceWorkerInstalled ? (isServiceWorkerHit ? 'hit' : 'miss') : 'uninstalled'

    const pageLoadProperties = { service_worker: serviceWorkerProperty }
    sendInitializationEvent(SharedEventName.APP_LOADED, pageLoadProperties)
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
    user.set(CustomUserProperties.DARK_MODE, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    user.set(CustomUserProperties.ROUTER_PREFERENCE, routerPreference)
  }, [routerPreference])

  useEffect(() => {
    const scrollListener = () => {
      setScrolledState(window.scrollY > 0)
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  const isBagExpanded = useBag((state) => state.bagExpanded)
  const isHeaderTransparent = !scrolledState && !isBagExpanded

  const { account } = useWeb3React()
  const statsigUser: StatsigUser = useMemo(
    () => ({
      userID: getDeviceId(),
      customIDs: { address: account ?? '' },
    }),
    [account]
  )

  // redirect address to landing pages until implemented
  const shouldRedirectToAppInstall = pathname?.startsWith('/address/')
  useLayoutEffect(() => {
    if (shouldRedirectToAppInstall) {
      window.location.href = getDownloadAppLink()
    }
  }, [shouldRedirectToAppInstall])

  if (shouldRedirectToAppInstall) {
    return null
  }

  const blockedPaths = document.querySelector('meta[name="x:blocked-paths"]')?.getAttribute('content')?.split(',')
  const shouldBlockPath = blockedPaths?.includes(pathname) ?? false
  if (shouldBlockPath && pathname !== '/swap') {
    return <Navigate to="/swap" replace />
  }

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <Trace page={currentPage}>
        <StatsigProvider
          user={statsigUser}
          // TODO: replace with proxy and cycle key
          sdkKey={STATSIG_DUMMY_KEY}
          waitForInitialization={false}
          options={{
            environment: { tier: getEnvName() },
            api: process.env.REACT_APP_STATSIG_PROXY_URL,
          }}
        >
          <HeaderWrapper transparent={isHeaderTransparent}>
            <NavBar blur={isHeaderTransparent} />
          </HeaderWrapper>
          <BodyWrapper>
            <Suspense>
              <AppChrome />
            </Suspense>
            <Suspense fallback={<Loader />}>
              {isLoaded ? (
                <Routes>
                  {routes.map((route: RouteDefinition) =>
                    route.enabled(routerConfig) ? (
                      <Route key={route.path} path={route.path} element={route.getElement(routerConfig)}>
                        {route.nestedPaths.map((nestedPath) => (
                          <Route path={nestedPath} key={`${route.path}/${nestedPath}`} />
                        ))}
                      </Route>
                    ) : null
                  )}
                </Routes>
              ) : (
                <Loader />
              )}
            </Suspense>
          </BodyWrapper>
          <MobileBottomBar>
            <PageTabs />
          </MobileBottomBar>
        </StatsigProvider>
      </Trace>
    </ErrorBoundary>
  )
}
