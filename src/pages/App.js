import React, { Suspense, lazy } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Web3ReactManager from '../components/Web3ReactManager'
import Header from '../components/Header'
import Footer from '../components/Footer'

import NavigationTabs from '../components/NavigationTabs'
import { isAddress, getAllQueryParams } from '../utils'

const Swap = lazy(() => import('./Swap'))
const Send = lazy(() => import('./Send'))
const Pool = lazy(() => import('./Pool'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  height: 100vh;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`
const FooterWrapper = styled.div`
  width: 100%;
  min-height: 30px;
  align-self: flex-end;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  flex: 1;
  overflow: auto;
`

const Body = styled.div`
  max-width: 35rem;
  width: 90%;
  /* margin: 0 1.25rem 1.25rem 1.25rem; */
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
            <Body>
              <Web3ReactManager>
                <BrowserRouter>
                  <NavigationTabs />
                  {/* this Suspense is for route code-splitting */}
                  <Suspense fallback={null}>
                    <Switch>
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
                      <Route
                        path={[
                          '/add-liquidity',
                          '/remove-liquidity',
                          '/create-exchange',
                          '/create-exchange/:tokenAddress?'
                        ]}
                        component={() => <Pool params={params} />}
                      />
                      <Redirect to="/swap" />
                    </Switch>
                  </Suspense>
                </BrowserRouter>
              </Web3ReactManager>
            </Body>
          </BodyWrapper>
          <FooterWrapper>
            <Footer />
          </FooterWrapper>
        </AppWrapper>
      </Suspense>
    </>
  )
}
