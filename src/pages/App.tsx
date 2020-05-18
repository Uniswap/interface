import React, { Suspense } from 'react'
import { BrowserRouter, Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom'
import styled from 'styled-components'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Create from '../components/CreatePool'
import Footer from '../components/Footer'

import Header from '../components/Header'
import NavigationTabs from '../components/NavigationTabs'
import Find from '../components/PoolFinder'

import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import { isAddress } from '../utils'
import Pool from './Pool'
import Add from './Pool/AddLiquidity'
import Remove from './Pool/RemoveLiquidity'
import Send from './Send'

import Swap from './Swap'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
  height: 100vh;
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
  box-sizing: border-box;
  padding-top: 160px;
  align-items: center;
  flex: 1;
  overflow: auto;
  z-index: 10;
  transition: height 0.3s ease;

  & > * {
    max-width: calc(420px + 4rem);
    width: 90%;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      padding: 16px;
  `};

  z-index: 1;
`

const Body = styled.div`
  max-width: 420px;
  width: 100%;
  /* min-height: 340px; */
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 30px;
  box-sizing: border-box;
  padding: 1rem;
  position: relative;
  margin-bottom: 10rem;
`

const StyledRed = styled.div`
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

// Redirects to swap but only replace the pathname
function RedirectPathToSwapOnly({ location }: RouteComponentProps) {
  return <Redirect to={{ ...location, pathname: '/swap' }} />
}

// Redirects from the /swap/:outputCurrency path to the /swap?outputCurrency=:outputCurrency format
function RedirectToSwap(props: RouteComponentProps<{ outputCurrency: string }>) {
  const {
    location: { search },
    match: {
      params: { outputCurrency }
    }
  } = props

  return (
    <Redirect
      to={{
        ...props.location,
        pathname: '/swap',
        search:
          search && search.length > 1
            ? `${search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`
      }}
    />
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <BrowserRouter>
          <Route component={GoogleAnalyticsReporter} />
          <Route component={DarkModeQueryParamReader} />
          <AppWrapper>
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <BodyWrapper>
              <Popups />
              <Web3ReactManager>
                <Body>
                  <NavigationTabs />
                  <Switch>
                    <Route exact strict path="/swap" component={Swap} />
                    <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                    <Route exact strict path="/send" component={Send} />
                    <Route exact strict path="/find" component={Find} />
                    <Route exact strict path="/create" component={Create} />
                    <Route exact strict path="/pool" component={Pool} />
                    <Route
                      exact
                      strict
                      path={'/add/:tokens'}
                      component={({ match }) => {
                        const tokens = match.params.tokens.split('-')
                        const t0 =
                          tokens?.[0] === 'ETH' ? 'ETH' : isAddress(tokens?.[0]) ? isAddress(tokens[0]) : undefined
                        const t1 =
                          tokens?.[1] === 'ETH' ? 'ETH' : isAddress(tokens?.[1]) ? isAddress(tokens[1]) : undefined
                        if (t0 && t1) {
                          return <Add token0={t0} token1={t1} />
                        } else {
                          return <Redirect to="/pool" />
                        }
                      }}
                    />
                    <Route
                      exact
                      strict
                      path={'/remove/:tokens'}
                      component={({ match }) => {
                        const tokens = match.params.tokens.split('-')
                        const t0 =
                          tokens?.[0] === 'ETH' ? 'ETH' : isAddress(tokens?.[0]) ? isAddress(tokens[0]) : undefined
                        const t1 =
                          tokens?.[1] === 'ETH' ? 'ETH' : isAddress(tokens?.[1]) ? isAddress(tokens[1]) : undefined
                        if (t0 && t1) {
                          return <Remove token0={t0} token1={t1} />
                        } else {
                          return <Redirect to="/pool" />
                        }
                      }}
                    />
                    <Route component={RedirectPathToSwapOnly} />
                  </Switch>
                </Body>
              </Web3ReactManager>
              <Footer />
            </BodyWrapper>
            <StyledRed />
          </AppWrapper>
        </BrowserRouter>
        <div id="popover-container" />
      </Suspense>
    </>
  )
}
