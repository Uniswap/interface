import { initializeAnalytics, OriginApplication, sendAnalyticsEvent, Trace, user } from '@uniswap/analytics'
import { CustomUserProperties, EventName, getBrowser, PageName } from '@uniswap/analytics-events'
import Loader from 'components/Loader'
import { MenuDropdown } from 'components/NavBar/MenuDropdown'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { Box } from 'nft/components/Box'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { SpinnerSVG } from 'theme/components'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'
import { isProductionEnv } from 'utils/env'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import { useAnalyticsReporter } from '../components/analytics'
import ErrorBoundary from '../components/ErrorBoundary'
import { PageTabs } from '../components/NavBar'
import NavBar from '../components/NavBar'
import Polling from '../components/Polling'
import Popups from '../components/Popups'
import { useIsExpertMode } from '../state/user/hooks'
import DarkModeQueryParamReader from '../theme/components/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import Landing from './Landing'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import NotFound from './NotFound'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import Swap from './Swap'
import { RedirectPathToSwapOnly } from './Swap/redirects'
import Tokens from './Tokens'

const TokenDetails = lazy(() => import('./TokenDetails'))
const Vote = lazy(() => import('./Vote'))
const NftExplore = lazy(() => import('nft/pages/explore'))
const Collection = lazy(() => import('nft/pages/collection'))
const Profile = lazy(() => import('nft/pages/profile/profile'))
const Asset = lazy(() => import('nft/pages/asset/Asset'))

// Placeholder API key. Actual API key used in the proxy server
const ANALYTICS_DUMMY_KEY = '00000000000000000000000000000000'
const ANALYTICS_PROXY_URL = process.env.REACT_APP_AMPLITUDE_PROXY_URL
const COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH
initializeAnalytics(ANALYTICS_DUMMY_KEY, OriginApplication.INTERFACE, {
  proxyUrl: ANALYTICS_PROXY_URL,
  defaultEventName: EventName.PAGE_VIEWED,
  commitHash: COMMIT_HASH,
  isProductionEnv: isProductionEnv(),
})

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
  width: 100vw;
  justify-content: space-between;
  padding: 4px 8px;
  height: ${({ theme }) => theme.mobileBottomBarHeight}px;
  background: ${({ theme }) => theme.backgroundSurface};
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    display: none;
  }
`

const HeaderWrapper = styled.div<{ transparent?: boolean }>`
  ${flexRowNoWrap};
  background-color: ${({ theme, transparent }) => !transparent && theme.backgroundSurface};
  border-bottom: ${({ theme, transparent }) => !transparent && `1px solid ${theme.backgroundOutline}`};
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.dropdown};
`

function getCurrentPageFromLocation(locationPathname: string): PageName | undefined {
  switch (true) {
    case locationPathname.startsWith('/swap'):
      return PageName.SWAP_PAGE
    case locationPathname.startsWith('/vote'):
      return PageName.VOTE_PAGE
    case locationPathname.startsWith('/pool'):
      return PageName.POOL_PAGE
    case locationPathname.startsWith('/tokens'):
      return PageName.TOKENS_PAGE
    case locationPathname.startsWith('/nfts/profile'):
      return PageName.NFT_PROFILE_PAGE
    case locationPathname.startsWith('/nfts/asset'):
      return PageName.NFT_DETAILS_PAGE
    case locationPathname.startsWith('/nfts/collection'):
      return PageName.NFT_COLLECTION_PAGE
    case locationPathname.startsWith('/nfts'):
      return PageName.NFT_EXPLORE_PAGE
    default:
      return undefined
  }
}

// this is the same svg defined in assets/images/blue-loader.svg
// it is defined here because the remote asset may not have had time to load when this file is executing
const LazyLoadSpinner = () => (
  <SpinnerSVG width="94" height="94" viewBox="0 0 94 94" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M92 47C92 22.1472 71.8528 2 47 2C22.1472 2 2 22.1472 2 47C2 71.8528 22.1472 92 47 92"
      stroke="#2172E5"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SpinnerSVG>
)

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()

  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isDarkMode = useIsDarkMode()
  const isExpertMode = useIsExpertMode()
  const [scrolledState, setScrolledState] = useState(false)

  useAnalyticsReporter()

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrolledState(false)
  }, [pathname])

  useEffect(() => {
    sendAnalyticsEvent(EventName.APP_LOADED)
    user.set(CustomUserProperties.USER_AGENT, navigator.userAgent)
    user.set(CustomUserProperties.BROWSER, getBrowser())
    user.set(CustomUserProperties.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    user.set(CustomUserProperties.SCREEN_RESOLUTION_WIDTH, window.screen.width)
    getCLS(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { cumulative_layout_shift: delta }))
    getFCP(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { first_contentful_paint_ms: delta }))
    getFID(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { first_input_delay_ms: delta }))
    getLCP(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { largest_contentful_paint_ms: delta }))
  }, [])

  useEffect(() => {
    user.set(CustomUserProperties.DARK_MODE, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    user.set(CustomUserProperties.EXPERT_MODE, isExpertMode)
  }, [isExpertMode])

  useEffect(() => {
    const scrollListener = () => {
      setScrolledState(window.scrollY > 0)
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  const isHeaderTransparent = !scrolledState

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <ApeModeQueryParamReader />
      <Trace page={currentPage}>
        <HeaderWrapper transparent={isHeaderTransparent}>
          <NavBar />
        </HeaderWrapper>
        <BodyWrapper>
          <Popups />
          <Polling />
          <TopLevelModals />
          <Suspense fallback={<Loader />}>
            {isLoaded ? (
              <Routes>
                <Route path="/" element={<Landing />} />

                <Route path="tokens" element={<Tokens />}>
                  <Route path=":chainName" />
                </Route>
                <Route path="tokens/:chainName/:tokenAddress" element={<TokenDetails />} />
                <Route
                  path="vote/*"
                  element={
                    <Suspense fallback={<LazyLoadSpinner />}>
                      <Vote />
                    </Suspense>
                  }
                />
                <Route path="create-proposal" element={<Navigate to="/vote/create-proposal" replace />} />

                <Route path="send" element={<RedirectPathToSwapOnly />} />
                <Route path="swap" element={<Swap />} />

                <Route path="pool/v2/find" element={<PoolFinder />} />
                <Route path="pool/v2" element={<PoolV2 />} />
                <Route path="pool" element={<Pool />} />
                <Route path="pool/:tokenId" element={<PositionPage />} />

                <Route path="add/v2" element={<RedirectDuplicateTokenIdsV2 />}>
                  <Route path=":currencyIdA" />
                  <Route path=":currencyIdA/:currencyIdB" />
                </Route>
                <Route path="add" element={<RedirectDuplicateTokenIds />}>
                  {/* this is workaround since react-router-dom v6 doesn't support optional parameters any more */}
                  <Route path=":currencyIdA" />
                  <Route path=":currencyIdA/:currencyIdB" />
                  <Route path=":currencyIdA/:currencyIdB/:feeAmount" />
                </Route>

                <Route path="increase" element={<AddLiquidity />}>
                  <Route path=":currencyIdA" />
                  <Route path=":currencyIdA/:currencyIdB" />
                  <Route path=":currencyIdA/:currencyIdB/:feeAmount" />
                  <Route path=":currencyIdA/:currencyIdB/:feeAmount/:tokenId" />
                </Route>

                <Route path="remove/v2/:currencyIdA/:currencyIdB" element={<RemoveLiquidity />} />
                <Route path="remove/:tokenId" element={<RemoveLiquidityV3 />} />

                <Route path="migrate/v2" element={<MigrateV2 />} />
                <Route path="migrate/v2/:address" element={<MigrateV2Pair />} />

                <Route
                  path="/nfts"
                  element={
                    <Suspense fallback={null}>
                      <NftExplore />
                    </Suspense>
                  }
                />
                <Route
                  path="/nfts/asset/:contractAddress/:tokenId"
                  element={
                    <Suspense fallback={null}>
                      <Asset />
                    </Suspense>
                  }
                />
                <Route
                  path="/nfts/profile"
                  element={
                    <Suspense fallback={null}>
                      <Profile />
                    </Suspense>
                  }
                />
                <Route
                  path="/nfts/collection/:contractAddress"
                  element={
                    <Suspense fallback={null}>
                      <Collection />
                    </Suspense>
                  }
                />
                <Route
                  path="/nfts/collection/:contractAddress/activity"
                  element={
                    <Suspense fallback={null}>
                      <Collection />
                    </Suspense>
                  }
                />

                <Route path="*" element={<Navigate to="/not-found" replace />} />
                <Route path="/not-found" element={<NotFound />} />
              </Routes>
            ) : (
              <Loader />
            )}
          </Suspense>
        </BodyWrapper>
        <MobileBottomBar>
          <PageTabs />
          <Box marginY="4">
            <MenuDropdown />
          </Box>
        </MobileBottomBar>
      </Trace>
    </ErrorBoundary>
  )
}
