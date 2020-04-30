import React, { Suspense, lazy } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Header from '../components/Header'
import NavigationTabs from '../components/NavigationTabs'
import Web3ReactManager from '../components/Web3ReactManager'

import Popups from '../components/Popups'
import { isAddress, getAllQueryParams } from '../utils'

const Swap = lazy(() => import('./Swap'))
const Send = lazy(() => import('./Send'))
const Pool = lazy(() => import('./Supply'))
const Add = lazy(() => import('./Supply/AddLiquidity'))
const Remove = lazy(() => import('./Supply/RemoveLiquidity'))
const Find = lazy(() => import('../components/PoolFinder'))
const Create = lazy(() => import('../components/CreatePool'))

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
  justify-content: flex-start;
  align-items: center;
  flex: 1;
  overflow: auto;
  padding-top: 100px;

  & > * {
    max-width: calc(355px + 4rem);
    width: 90%;
  }

  z-index: 1;
`

const Body = styled.div`
  max-width: 355px;
  width: 100%;
  min-height: 340px;
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 30px;
  box-sizing: border-box;
  padding: 1rem;
`

export default function App() {
  const params = getAllQueryParams()

  return (
    <>
      <Suspense fallback={null}>
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Body>
              <Web3ReactManager>
                <BrowserRouter>
                  <NavigationTabs />
                  {/* this Suspense is for route code-splitting */}
                  <Suspense fallback={null}>
                    <Switch>
                      <Route exact strict path="/" render={() => <Redirect to={{ pathname: '/swap' }} />} />
                      <Route exact strict path="/find" component={() => <Find params={params} />} />
                      <Route exact strict path="/create" component={() => <Create params={params} />} />
                      <Route exact strict path="/swap" component={() => <Swap params={params} />} />
                      <Route
                        exact
                        strict
                        path="/swap/:tokenAddress?"
                        render={({ match, location }) => {
                          if (isAddress(match.params.tokenAddress)) {
                            return (
                              <Swap
                                location={location}
                                initialCurrency={isAddress(match.params.tokenAddress)}
                                params={params}
                              />
                            )
                          } else {
                            return <Redirect to={{ pathname: '/swap' }} />
                          }
                        }}
                      />
                      <Route exact strict path="/send" component={() => <Send params={params} />} />
                      <Route
                        exact
                        strict
                        path="/send/:tokenAddress?"
                        render={({ match }) => {
                          if (isAddress(match.params.tokenAddress)) {
                            return <Send initialCurrency={isAddress(match.params.tokenAddress)} params={params} />
                          } else {
                            return <Redirect to={{ pathname: '/send' }} />
                          }
                        }}
                      />
                      <Route exaxct path={'/pool'} component={() => <Pool params={params} />} />
                      <Route
                        exact
                        strict
                        path={'/add/:tokens'}
                        component={({ match }) => {
                          const tokens = match.params.tokens.split('-')
                          let t0
                          let t1
                          if (tokens) {
                            t0 = tokens?.[0] === 'ETH' ? 'ETH' : isAddress(tokens[0])
                            t1 = tokens?.[1] === 'ETH' ? 'ETH' : isAddress(tokens[1])
                          }
                          if (t0 && t1) {
                            return <Add params={params} token0={t0} token1={t1} />
                          } else {
                            return <Redirect to={{ pathname: '/pool' }} />
                          }
                        }}
                      />
                      <Route
                        exact
                        strict
                        path={'/remove/:tokens'}
                        component={({ match }) => {
                          const tokens = match.params.tokens.split('-')
                          let t0
                          let t1
                          if (tokens) {
                            t0 = tokens?.[0] === 'ETH' ? 'ETH' : isAddress(tokens[0])
                            t1 = tokens?.[1] === 'ETH' ? 'ETH' : isAddress(tokens[1])
                          }
                          if (t0 && t1) {
                            return <Remove params={params} token0={t0} token1={t1} />
                          } else {
                            return <Redirect to={{ pathname: '/pool' }} />
                          }
                        }}
                      />
                      <Route exaxct path={'/remove'} component={() => <Remove params={params} />} />
                    </Switch>
                  </Suspense>
                </BrowserRouter>
              </Web3ReactManager>
            </Body>
          </BodyWrapper>
        </AppWrapper>
      </Suspense>
    </>
  )
}
