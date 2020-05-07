import React, { Suspense, lazy } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'
import NavigationTabs from '../components/NavigationTabs'
import Web3ReactManager from '../components/Web3ReactManager'

import Popups from '../components/Popups'
import { isAddress, getAllQueryParams } from '../utils'

const Swap = lazy(() => import('./Swap'))
const Send = lazy(() => import('./Send'))
const Pool = lazy(() => import('./Pool'))
const Add = lazy(() => import('./Pool/AddLiquidity'))
const Remove = lazy(() => import('./Pool/RemoveLiquidity'))
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
  /* justify-content: center; */
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
      padding-top: 16px;
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
  background: ${({ theme }) => `radial-gradient(50% 50% at 50% 50%, ${theme.pink2} 0%, ${theme.bg1} 100%)`};
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

export default function App() {
  const params = getAllQueryParams()

  return (
    <>
      <Suspense fallback={null}>
        <BrowserRouter>
          <AppWrapper>
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <BodyWrapper>
              <Popups />
              <Body>
                <Web3ReactManager>
                  <NavigationTabs />
                  {/* this Suspense is for route code-splitting */}
                  <Suspense fallback={null}>
                    <Switch>
                      <Route exact strict path="/" render={() => <Redirect to="/swap" />} />
                      <Route exact strict path="/swap" component={() => <Swap params={params} />} />
                      <Route exact strict path="/send" component={() => <Send params={params} />} />
                      <Route exact strict path="/find" component={() => <Find params={params} />} />
                      <Route exact strict path="/create" component={() => <Create params={params} />} />
                      <Route exact strict path="/pool" component={() => <Pool params={params} />} />
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
                            return <Add token0={t0} token1={t1} params={params} />
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
                            return <Remove token0={t0} token1={t1} params={params} />
                          } else {
                            return <Redirect to="/pool" />
                          }
                        }}
                      />
                      <Redirect to="/" />
                    </Switch>
                  </Suspense>
                </Web3ReactManager>
              </Body>
              <Footer></Footer>
            </BodyWrapper>
            <StyledRed />
          </AppWrapper>
        </BrowserRouter>
      </Suspense>
    </>
  )
}
