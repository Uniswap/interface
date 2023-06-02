import { useWeb3React } from '@web3-react/core'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { useAtom } from 'jotai'
import { useBag } from 'nft/hooks/useBag'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import styled from 'styled-components/macro'
import { SpinnerSVG } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

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
import { BodyWrapper } from './AppBody'
import Landing from './Landing'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import NotFound from './NotFound'
import Pool from './Pool'
import PositionPage from './Pool/PositionPage'
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
// TODO: check mobile border
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
  background-color: ${({ theme, transparent }) => !transparent && theme.backgroundScrolledSurface};
  border-bottom: ${({ theme, transparent }) => !transparent && `1px solid ${theme.backgroundOutline}`};
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.dropdown};
`

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
  const [shouldDisableNFTRoutes, setShouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)

  const { pathname } = useLocation()
  const isDarkMode = useIsDarkMode()
  const isExpertMode = useIsExpertMode()
  const [scrolledState, setScrolledState] = useState(false)

  useAnalyticsReporter()

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
    const scrollListener = () => {
      setScrolledState(window.scrollY > 0)
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  const isBagExpanded = useBag((state) => state.bagExpanded)
  const isHeaderTransparent = !scrolledState && !isBagExpanded

  const { account } = useWeb3React()

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <ApeModeQueryParamReader />
      {isDarkMode ? (
        <>
          <div id="starsLightMode"></div>
          <div id="starsLightMode2"></div>
          <div id="starsLightMode3"></div>
        </>
      ) : (
        <>
          <div id="stars"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </>
      )}
      <HeaderWrapper transparent={isHeaderTransparent}>
        <NavBar blur={isHeaderTransparent} />
      </HeaderWrapper>
      <BodyWrapper $maxWidth="100%">
        <Popups />
        <Polling />
        <TopLevelModals />
        <Suspense fallback={<LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} />}>
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

              <Route path="pools/v2/find" element={<PoolFinder />} />
              <Route path="pools/v2" element={<PoolV2 />} />
              <Route path="pools" element={<Pool />} />
              <Route path="pools/:tokenId" element={<PositionPage />} />

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

              {!shouldDisableNFTRoutes && (
                <>
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
                </>
              )}

              <Route path="*" element={<Navigate to="/not-found" replace />} />
              <Route path="/not-found" element={<NotFound />} />
            </Routes>
          ) : (
            <LoaderGif gif={isDarkMode ? LoadingGif : LoadingGifLight} />
          )}
        </Suspense>
      </BodyWrapper>
      <MobileBottomBar>
        <PageTabs />
      </MobileBottomBar>
    </ErrorBoundary>
  )
}
