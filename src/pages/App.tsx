import { initializeAnalytics } from 'components/AmplitudeAnalytics'
import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import Loader from 'components/Loader'
import TopLevelModals from 'components/TopLevelModals'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { lazy, Suspense } from 'react'
import { useEffect } from 'react'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
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

export default function App() {
  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(location.pathname)
  useAnalyticsReporter()
  initializeAnalytics()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

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
              <Switch>
                <Route strict path="/vote">
                  <Vote />
                </Route>
                <Route exact strict path="/create-proposal">
                  <Redirect to="/vote/create-proposal" />
                </Route>
                <Route exact strict path="/claim">
                  <OpenClaimAddressModalAndRedirectToSwap />
                </Route>
                <Route exact strict path="/uni">
                  <Earn />
                </Route>
                <Route exact strict path="/uni/:currencyIdA/:currencyIdB">
                  <Manage />
                </Route>

                <Route exact strict path="/send">
                  <RedirectPathToSwapOnly />
                </Route>
                <Route exact strict path="/swap/:outputCurrency">
                  <RedirectToSwap />
                </Route>
                <Route exact strict path="/swap">
                  <Swap />
                </Route>

                <Route exact strict path="/pool/v2/find">
                  <PoolFinder />
                </Route>
                <Route exact strict path="/pool/v2">
                  <PoolV2 />
                </Route>
                <Route exact strict path="/pool">
                  <Pool />
                </Route>
                <Route exact strict path="/pool/:tokenId">
                  <PositionPage />
                </Route>

                <Route exact strict path="/add/v2/:currencyIdA?/:currencyIdB?">
                  <RedirectDuplicateTokenIdsV2 />
                </Route>
                <Route exact strict path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?">
                  <RedirectDuplicateTokenIds />
                </Route>

                <Route exact strict path="/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?">
                  <AddLiquidity />
                </Route>

                <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB">
                  <RemoveLiquidity />
                </Route>
                <Route exact strict path="/remove/:tokenId">
                  <RemoveLiquidityV3 />
                </Route>

                <Route exact strict path="/migrate/v2">
                  <MigrateV2 />
                </Route>
                <Route exact strict path="/migrate/v2/:address">
                  <MigrateV2Pair />
                </Route>

                <Route>
                  <RedirectPathToSwapOnly />
                </Route>
              </Switch>
            </Suspense>
            <Marginer />
          </BodyWrapper>
        </Trace>
      </AppWrapper>
    </ErrorBoundary>
  )
}
