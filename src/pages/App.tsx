import { initializeAnalytics } from 'components/AmplitudeAnalytics'
import { sendAnalyticsEvent, user } from 'components/AmplitudeAnalytics'
import { BROWSER, CUSTOM_USER_PROPERTIES, EventName, PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import Loader from 'components/Loader'
import TopLevelModals from 'components/TopLevelModals'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { lazy, Suspense } from 'react'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'

import { useAnalyticsReporter } from '../components/analytics'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import Earn from './Earn'
import Manage from './Earn/Manage'
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

// lazy load vote related pages
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
    default:
      return undefined
  }
}

// Get browser being used, code comes from: https://developer.mozilla.org/en-US/docs/Web/API/Window/navigator.
function getBrowser(): string {
  const sUsrAg = navigator.userAgent
  // The order matters here, and this may report false positives for unlisted browsers.
  if (sUsrAg.indexOf('Firefox') > -1) {
    return BROWSER.FIREFOX
    // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
  } else if (sUsrAg.indexOf('SamsungBrowser') > -1) {
    return BROWSER.SAMSUNG
    // "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G955F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.4 Chrome/67.0.3396.87 Mobile Safari/537.36
  } else if (sUsrAg.indexOf('Opera') > -1 || sUsrAg.indexOf('OPR') > -1) {
    return BROWSER.OPERA
    // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.106"
  } else if (sUsrAg.indexOf('Trident') > -1) {
    return BROWSER.INTERNET_EXPLORER
    // "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
  } else if (sUsrAg.indexOf('Edge') > -1) {
    return BROWSER.EDGE
    // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
  } else if (sUsrAg.indexOf('Edg') > -1) {
    return BROWSER.EDGE_CHROMIUM
    // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.64
  } else if (sUsrAg.indexOf('Chrome') > -1) {
    return BROWSER.CHROME
    // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
  } else if (sUsrAg.indexOf('Safari') > -1) {
    return BROWSER.SAFARI
    // "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
  } else {
    return BROWSER.UNKNOWN
  }
}

export default function App() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isDarkMode = useIsDarkMode()

  useAnalyticsReporter()
  initializeAnalytics()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    // TODO(zzmp): add web vitals event properties to app loaded event.
    sendAnalyticsEvent(EventName.APP_LOADED)
    user.set(CUSTOM_USER_PROPERTIES.BROWSER, getBrowser())
    user.set(CUSTOM_USER_PROPERTIES.DARK_MODE, isDarkMode)
    user.set(CUSTOM_USER_PROPERTIES.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    user.set(CUSTOM_USER_PROPERTIES.SCREEN_RESOLUTION_WIDTH, window.screen.width)
  }, [isDarkMode])

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
              <Routes>
                <Route path="vote/*" element={<Vote />} />
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
            </Suspense>
            <Marginer />
          </BodyWrapper>
        </Trace>
      </AppWrapper>
    </ErrorBoundary>
  )
}
