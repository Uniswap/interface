import React, { lazy, Suspense } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Web3ReactManager from '../components/Web3ReactManager'
import Header from '../components/Header'
import InfoPage from '../components/InfoPage/InfoPage'
import Footer from '../components/Footer'
import LoginScreen from './Login/LoginScreen'

import NavigationTabs from '../components/NavigationTabs'
import { getAllQueryParams } from '../utils'

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
`

const Body = styled.div`
  max-width: 35rem;
  width: 90%;
  margin-top: 150px;
  /* margin: 0 1.25rem 1.25rem 1.25rem; */
`

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isLoggedIn: false,
      displayInfoPage: false
    }
  }

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

    if (!this.state.isLoggedIn) {
      return (
        <BrowserRouter>
          <Route path="/login">
            <LoginScreen onLogin={() => this.setState({ isLoggedIn: true })}/>
          </Route>
          <Redirect to="/login"/>
        </BrowserRouter>
      )
    }

    if (this.state.displayInfoPage) {
      return (
        <BrowserRouter>
          <Route path={'/info'}>
            <InfoPage onClose={() => this.setState({ displayInfoPage: false })}/>
          </Route>
          <Redirect to="/info"/>
        </BrowserRouter>
      )
    }

    return (
      <>
        <Suspense fallback={null}>
          <AppWrapper>
            <HeaderWrapper>
              <Header onDisplayInfo={() => this.setState({ displayInfoPage: true })}/>
            </HeaderWrapper>
            <BodyWrapper>
              <Body>
                <Web3ReactManager>
                  <BrowserRouter>
                    <NavigationTabs/>
                    {/* this Suspense is for route code-splitting */}
                    <Suspense fallback={null}>
                      <Switch>
                        <Route exact strict path="/swap" component={() => <Swap params={params}/>}/>
                        {/*<Route*/}
                        {/*  exact*/}
                        {/*  strict*/}
                        {/*  path="/swap/:tokenAddress?"*/}
                        {/*  render={({ match, location }) => {*/}
                        {/*    if (isAddress(match.params.tokenAddress)) {*/}
                        {/*      return (*/}
                        {/*        <Swap*/}
                        {/*          location={location}*/}
                        {/*          initialCurrency={isAddress(match.params.tokenAddress)}*/}
                        {/*          params={params}*/}
                        {/*        />*/}
                        {/*      )*/}
                        {/*    } else {*/}
                        {/*      return <Redirect to={{ pathname: '/swap' }} />*/}
                        {/*    }*/}
                        {/*  }}*/}
                        {/*/>*/}
                        {/*<Route exact strict path="/send" component={() => <Send params={params} />} />*/}
                        {/*<Route*/}
                        {/*  exact*/}
                        {/*  strict*/}
                        {/*  path="/send/:tokenAddress?"*/}
                        {/*  render={({ match }) => {*/}
                        {/*    if (isAddress(match.params.tokenAddress)) {*/}
                        {/*      return <Send initialCurrency={isAddress(match.params.tokenAddress)} params={params} />*/}
                        {/*    } else {*/}
                        {/*      return <Redirect to={{ pathname: '/send' }} />*/}
                        {/*    }*/}
                        {/*  }}*/}
                        {/*/>*/}
                        {/*<Route*/}
                        {/*  path={[*/}
                        {/*    '/add-liquidity',*/}
                        {/*    '/remove-liquidity',*/}
                        {/*    '/create-exchange',*/}
                        {/*    '/create-exchange/:tokenAddress?'*/}
                        {/*  ]}*/}
                        {/*  component={() => <Pool params={params} />}*/}
                        {/*/>*/}
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
