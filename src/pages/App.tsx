import React, { Suspense } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import styled from 'styled-components/macro'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import ErrorBoundary from '../components/ErrorBoundary'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
// import Earn from './Earn'
import { Playground } from './Earn/Play'
// import Manage from './Earn/Manage'
// import MigrateV2 from './MigrateV2'
// import MigrateV2Pair from './MigrateV2/MigrateV2Pair'

import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
// import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
// import AddLiquidity from './AddLiquidity'
import { ThemedBackground } from '../theme'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 120px;
  align-items: center;
  flex: 1;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    padding-top: 6rem;
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

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Route component={GoogleAnalyticsReporter} />
        <Route component={DarkModeQueryParamReader} />
        <Route component={ApeModeQueryParamReader} />
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <ThemedBackground />
            <Popups />
            <Polling />
            <Web3ReactManager>
              <Switch>
                <Route exact strict path="/play" component={Playground} />
                {/* <Route exact strict path="/farm" component={Earn} /> */}

                {/* <Route exact strict path="/farm/:currencyIdA/:currencyIdB" component={Manage} /> */}

                <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/swap" component={Swap} />

                <Route exact strict path="/find" component={PoolFinder} />
                <Route exact strict path="/pool/v2" component={PoolV2} />
                {/* <Route exact strict path="/pool" component={Pool} /> */}
                <Redirect from="/pool" to="/pool/v2" />
                {/* <Route exact strict path="/pool/:tokenId" component={PositionPage} /> */}

                <Route
                  exact
                  strict
                  path="/add/v2/:currencyIdA?/:currencyIdB?"
                  component={RedirectDuplicateTokenIdsV2}
                />
                {/* <Route
                  exact
                  strict
                  path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                  component={RedirectDuplicateTokenIds}
                /> */}

                {/* <Route
                  exact
                  strict
                  path="/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?"
                  component={AddLiquidity}
                /> */}

                <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                {/* <Route exact strict path="/remove/:tokenId" component={RemoveLiquidityV3} /> */}

                {/* <Route exact strict path="/migrate/v2" component={MigrateV2} /> */}
                {/* <Route exact strict path="/migrate/v2/:address" component={MigrateV2Pair} /> */}

                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Web3ReactManager>
            <Marginer />
          </BodyWrapper>
        </AppWrapper>
      </Suspense>
    </ErrorBoundary>
  )
}
