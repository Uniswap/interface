import { initializeAnalytics, sendAnalyticsEvent, user } from 'components/AmplitudeAnalytics'
import { CUSTOM_USER_PROPERTIES, EventName, PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import Loader from 'components/Loader'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import { ExploreVariant, useExploreFlag } from 'featureFlags/flags/explore'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { SpinnerSVG } from 'theme/components'
import { getBrowser } from 'utils/browser'

import { useAnalyticsReporter } from '../components/analytics'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import { useIsExpertMode } from '../state/user/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import Earn from './Earn'
import Manage from './Earn/Manage'
import Explore from './Explore'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import Swap from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'

const TokenDetails = lazy(() => import('./TokenDetails'))
const Vote = lazy(() => import('./Vote'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 120px 16px 0px 16px;
  align-items: center;
  flex: 1;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 4rem 8px 16px 8px;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: 2;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

function getCurrentPageFromLocation(locationPathname: string): PageName | undefined {
  switch (locationPathname) {
    case '/swap':
      return PageName.SWAP_PAGE
    case '/vote':
      return PageName.VOTE_PAGE
    case '/pool':
      return PageName.POOL_PAGE
    case '/explore':
      return PageName.EXPLORE_PAGE
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
  const exploreFlag = useExploreFlag()

  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isDarkMode = useIsDarkMode()
  const isExpertMode = useIsExpertMode()

  useAnalyticsReporter()
  initializeAnalytics()

  useSyncChainQuery()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    // TODO(zzmp): add web vitals event properties to app loaded event.
    sendAnalyticsEvent(EventName.APP_LOADED)
    user.set(CUSTOM_USER_PROPERTIES.BROWSER, getBrowser())
    user.set(CUSTOM_USER_PROPERTIES.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    user.set(CUSTOM_USER_PROPERTIES.SCREEN_RESOLUTION_WIDTH, window.screen.width)
  }, [])

  useEffect(() => {
    user.set(CUSTOM_USER_PROPERTIES.DARK_MODE, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    user.set(CUSTOM_USER_PROPERTIES.EXPERT_MODE, isExpertMode)
  }, [isExpertMode])

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <ApeModeQueryParamReader />
      <AppWrapper>
        <Trace page={currentPage}>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Polling />
            <TopLevelModals />
            <Suspense fallback={<Loader />}>
              {isLoaded ? (
                <Routes>
                  {exploreFlag === ExploreVariant.Enabled && (
                    <>
                      <Route path="/explore" element={<Explore />} />
                      <Route
                        path="/tokens/:tokenAddress"
                        element={
                          <Suspense fallback={<LazyLoadSpinner />}>
                            <TokenDetails />
                          </Suspense>
                        }
                      />
                    </>
                  )}
                  <Route
                    path="vote/*"
                    element={
                      <Suspense fallback={<LazyLoadSpinner />}>
                        <Vote />
                      </Suspense>
                    }
                  />
                  <Route path="create-proposal" element={<Navigate to="/vote/create-proposal" replace />} />
                  <Route path="claim" element={<OpenClaimAddressModalAndRedirectToSwap />} />
                  <Route path="uni" element={<Earn />} />
                  <Route path="uni/:currencyIdA/:currencyIdB" element={<Manage />} />

                  <Route path="send" element={<RedirectPathToSwapOnly />} />
                  <Route path="swap/:outputCurrency" element={<RedirectToSwap />} />
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

                  <Route path="*" element={<RedirectPathToSwapOnly />} />
                </Routes>
              ) : (
                <Loader />
              )}
            </Suspense>
            <Marginer />
          </BodyWrapper>
        </Trace>
      </AppWrapper>
    </ErrorBoundary>
  )
}
