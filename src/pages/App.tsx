import React, { Suspense } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Header from '../components/Header'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds, RedirectOldAddLiquidityPathStructure } from './AddLiquidity/redirects'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import BoostTab from './Boost'
import Hero from './Hero'
import StakeTab from './Stake'
import Yield from './Yield'
import TermsAndConditionsModal from '../components/TermsAndConditionsModal'
import TagManager from 'react-gtm-module'

const tagManagerArgs = {
  js: new Date(),
  gtmId: process.env.REACT_APP_GTM || ''
}

TagManager.initialize(tagManagerArgs)

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 160px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      padding: 16px;
  `};

  z-index: 1;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

export default function App() {
  return (
    <Suspense fallback={null}>
      <TermsAndConditionsModal />
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Route component={GoogleAnalyticsReporter} />
        <Route component={DarkModeQueryParamReader} />
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Hero />
            <Web3ReactManager>
              <Switch>
                <Route exact strict path="/swap" component={Swap} />
                <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/find" component={PoolFinder} />
                <Route exact strict path="/swap-pool" component={Pool} />
                <Route exact strict path="/swap-boost" component={BoostTab} />
                <Route exact strict path="/swap-boost/stake" component={StakeTab} />
                <Route exact path="/swap-add" component={AddLiquidity} />
                <Route exact path="/swap-add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                <Route exact path="/swap-add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                <Route exact strict path="/swap-remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
                <Route exact strict path="/swap-remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                <Route exact strict path="/swap-apy" component={Yield} />
                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Web3ReactManager>
            <Marginer />
          </BodyWrapper>
        </AppWrapper>
      </BrowserRouter>
    </Suspense>
  )
}
