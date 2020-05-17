import React, { Suspense, useEffect } from 'react'
import styled from 'styled-components'
import ReactGA from 'react-ga'
import { BrowserRouter, Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'
import NavigationTabs from '../components/NavigationTabs'
import Web3ReactManager from '../components/Web3ReactManager'

import Popups from '../components/Popups'
import { isAddress } from '../utils'

import Swap from './Swap'
import Send from './Send'
import Pool from './Pool'
import Add from './Pool/AddLiquidity'
import Remove from './Pool/RemoveLiquidity'
import Find from '../components/PoolFinder'
import Create from '../components/CreatePool'

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

// fires a GA pageview every time the route changes
function GoogleAnalyticsReporter({ location: { pathname, search } }: RouteComponentProps) {
  useEffect(() => {
    ReactGA.pageview(`${pathname}${search}`)
  }, [pathname, search])
  return null
}

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <BrowserRouter>
          <Route component={GoogleAnalyticsReporter} />
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
                    <Redirect to="/swap" />
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
