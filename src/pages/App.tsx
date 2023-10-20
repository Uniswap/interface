import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import ErrorBoundary from 'components/ErrorBoundary'
import Loader from 'components/Icons/LoadingSpinner'
import NavBar, { PageTabs } from 'components/NavBar'
import { UK_BANNER_HEIGHT, UK_BANNER_HEIGHT_MD, UK_BANNER_HEIGHT_SM, UkBanner } from 'components/NavBar/UkBanner'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import { useAtom } from 'jotai'
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import styled from 'styled-components'
import DarkModeQueryParamReader from 'theme/components/DarkModeQueryParamReader'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'
import { getDownloadAppLink } from 'utils/openDownloadApp'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

import { MixPanelTrackEvent } from './mixpanel'
import { RouteDefinition, routes, useRouterConfig } from './RouteDefinitions'

const AppChrome = lazy(() => import('./AppChrome'))

const BodyWrapper = styled.div<{ bannerIsVisible?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - ${({ bannerIsVisible }) => (bannerIsVisible ? UK_BANNER_HEIGHT : 0)}px);
  padding: ${({ theme }) => theme.navHeight}px 0px 5rem 0px;
  align-items: center;
  flex: 1;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    min-height: calc(100vh - ${({ bannerIsVisible }) => (bannerIsVisible ? UK_BANNER_HEIGHT_MD : 0)}px);
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    min-height: calc(100vh - ${({ bannerIsVisible }) => (bannerIsVisible ? UK_BANNER_HEIGHT_SM : 0)}px);
  }
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

const HeaderWrapper = styled.div<{ transparent?: boolean; bannerIsVisible?: boolean; scrollY: number }>`
  ${flexRowNoWrap};
  background-color: ${({ theme, transparent }) => !transparent && theme.surface1};
  border-bottom: ${({ theme, transparent }) => !transparent && `1px solid ${theme.surface3}`};
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: ${({ bannerIsVisible }) => (bannerIsVisible ? Math.max(UK_BANNER_HEIGHT - scrollY, 0) : 0)}px;
  z-index: ${Z_INDEX.dropdown};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    top: ${({ bannerIsVisible }) => (bannerIsVisible ? Math.max(UK_BANNER_HEIGHT_MD - scrollY, 0) : 0)}px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    top: ${({ bannerIsVisible }) => (bannerIsVisible ? Math.max(UK_BANNER_HEIGHT_SM - scrollY, 0) : 0)}px;
  }
`

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()
  const [, setShouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)

  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(pathname)

  const [scrollY, setScrollY] = useState(0)
  const scrolledState = scrollY > 0

  const routerConfig = useRouterConfig()

  //Show banner
  const renderBanner = true

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrollY(0)
  }, [pathname])

  useEffect(() => {
    MixPanelTrackEvent({
      category: 'Dapp Visit DEX',
      action: 'User Landed',
      label: 'Wallet not connected',
    })
  }, [])

  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('disableNFTs') === 'true') {
      setShouldDisableNFTRoutes(true)
    } else if (searchParams.get('disableNFTs') === 'false') {
      setShouldDisableNFTRoutes(false)
    }
  }, [searchParams, setShouldDisableNFTRoutes])

  useEffect(() => {
    const scrollListener = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  const isHeaderTransparent = !scrolledState

  const { account } = useWeb3React()

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

  const blockedPaths = document.querySelector('meta[property="x:blocked-paths"]')?.getAttribute('content')?.split(',')
  const shouldBlockPath = blockedPaths?.includes(pathname) ?? false
  if (shouldBlockPath && pathname !== '/swap') {
    return <Navigate to="/swap" replace />
  }

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <Trace page={currentPage}>
        {renderBanner && <UkBanner />}
        <HeaderWrapper transparent={isHeaderTransparent} bannerIsVisible={renderBanner} scrollY={scrollY}>
          <NavBar blur={isHeaderTransparent} />
        </HeaderWrapper>
        <BodyWrapper bannerIsVisible={renderBanner}>
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
      </Trace>
    </ErrorBoundary>
  )
}
