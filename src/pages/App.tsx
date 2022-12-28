import { Trace, user } from '@uniswap/analytics'
import { CustomUserProperties, PageName } from '@uniswap/analytics-events'
import Loader from 'components/Loader'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

import ErrorBoundary from '../components/ErrorBoundary'
import { PageTabs } from '../components/NavBar'
import NavBar from '../components/NavBar'
import Polling from '../components/Polling'
import Popups from '../components/Popups'
import { useIsExpertMode } from '../state/user/hooks'
import DarkModeQueryParamReader from '../theme/components/DarkModeQueryParamReader'
import Landing from './Landing'
import NotFound from './NotFound'
import Swap from './Swap'
import { RedirectPathToSwapOnly } from './Swap/redirects'

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

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()

  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isDarkMode = useIsDarkMode()
  const isExpertMode = useIsExpertMode()
  const [scrolledState, setScrolledState] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrolledState(false)
  }, [pathname])

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
                <Route path="send" element={<RedirectPathToSwapOnly />} />
                <Route path="swap" element={<Swap />} />
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
        </MobileBottomBar>
      </Trace>
    </ErrorBoundary>
  )
}
