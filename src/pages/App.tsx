import React, { Suspense } from 'react'
import { BrowserRouter, HashRouter, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import CreatePool from './CreatePool'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import Send from './Send'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'

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

const BackgroundGradient = styled.div`
  width: 100%;
  height: 200vh;
  background: ${({ theme }) => `radial-gradient(50% 50% at 50% 50%, ${theme.primary1} 0%, ${theme.bg1} 100%)`};
  position: absolute;
  top: 0px;
  left: 0px;
  opacity: 0.1;
  z-index: -1;

  transform: translateY(-70vh);

  @media (max-width: 960px) {
    height: 300px;
    width: 100%;
    transform: translateY(-150px);
  }
`

const Marginer = styled.div`
  margin-top: 5rem;
`

let Router: React.ComponentType
if (process.env.PUBLIC_URL === '.') {
  Router = HashRouter
} else {
  Router = BrowserRouter
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Router>
        <Route component={GoogleAnalyticsReporter} />
        <Route component={DarkModeQueryParamReader} />
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Web3ReactManager>
              <Switch>
                <Route exact strict path="/swap" component={Swap} />
                <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/send" component={Send} />
                <Route exact strict path="/find" component={PoolFinder} />
                <Route exact strict path="/pool" component={Pool} />
                <Route exact strict path="/create" component={CreatePool} />
                <Route exact strict path="/add/:tokens" component={AddLiquidity} />
                <Route exact strict path="/remove/:tokens" component={RemoveLiquidity} />
                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Web3ReactManager>
            <Marginer />
            <Footer />
          </BodyWrapper>
          <BackgroundGradient />
        </AppWrapper>
      </Router>
    </Suspense>
  )
}
