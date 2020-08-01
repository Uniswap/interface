import React, { lazy, Suspense } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Web3ReactManager from '../components/Web3ReactManager'
import Header from '../components/Header'
import Footer from '../components/Footer'

import NavigationTabs from '../components/NavigationTabs'
import { getAllQueryParams } from '../utils'

import Send from './Send'
import Vote from './Vote'
import Details from './Vote/Details'
import { isAddress } from '../utils/index'

const Swap = lazy(() => import('./Swap'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  height: 100vh;
  background: linear-gradient(360deg, #327ccb, #4f94de 5%, #8bbbef 15%, #bdddff 25%, #deeeff 40%);
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
  padding:bottom: 40px;
`

const Body = styled.div`
  max-width: 35rem;
  width: 90%;
  margin-top: 30px;
  /* margin: 0 1.25rem 1.25rem 1.25rem; */

  @media (max-width: 1000px) {
    margin-top: 80px;
  }
`

class App extends React.Component {

  render() {
    const params = getAllQueryParams()

    const key = 'REFERRAL_ADDRESS'
    const referrer = window.localStorage.getItem(key)
    if (params.referrer) {
      window.localStorage.setItem(key, params.referrer)
    } else {
      params.referrer = referrer
    }
    window.referrer = params.referrer

    return (
      <>
        <Suspense fallback={null}>
          <AppWrapper>
            <HeaderWrapper>
              <Header hideInfo hideBuy/>
            </HeaderWrapper>
            <BodyWrapper>
              <Body>
                <Web3ReactManager>
                  <BrowserRouter>
                    <NavigationTabs/>
                    { /*this Suspense is for route code-splitting*/ }
                    <Suspense fallback={null}>
                      <Switch>
                        <Route exact strict path="/swap" component={() => <Swap params={params}/>}/>
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
                        <Route exact strict path="/burn" component={() => <Send params={params} />} />
                        <Route exact strict path="/vote" component={() => <Vote/>}/>
                        <Route exact strict path="/vote/:proposal_id" component={() => <Details/>}/>
                        <Redirect to="/swap"/>
                      </Switch>
                    </Suspense>
                  </BrowserRouter>
                </Web3ReactManager>
              </Body>
            </BodyWrapper>
            <FooterWrapper>
              <Footer/>
            </FooterWrapper>
          </AppWrapper>
        </Suspense>
      </>
    )
  }
}

export default App
