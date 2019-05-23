import React, { Suspense, lazy } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Web3ReactManager from '../components/Web3ReactManager'
import Header from '../components/Header'
import NavigationTabs from '../components/NavigationTabs'

const Swap = lazy(() => import('./Swap'))
const Send = lazy(() => import('./Send'))
const Pool = lazy(() => import('./Pool'))

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: center;
  flex-grow: 1;
  flex-basis: 0;
  overflow: auto;
`

const Body = styled.div`
  width: 35rem;
  margin: 1.25rem;
`

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
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
                    <Route exact strict path="/swap" component={Swap} />
                    <Route exact strict path="/send" component={Send} />
                    <Route
                      path={[
                        '/add-liquidity',
                        '/remove-liquidity',
                        '/create-exchange',
                        '/create-exchange/:tokenAddress?'
                      ]}
                      component={Pool}
                    />
                    <Redirect to="/swap" />
                  </Switch>
                </Suspense>
              </BrowserRouter>
            </Web3ReactManager>
          </Body>
        </BodyWrapper>
      </Suspense>
    </>
  )
}
