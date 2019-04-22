import React, { useState, useEffect, lazy, Suspense } from 'react'
import { connect } from 'react-redux'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useWeb3Context, Connectors } from 'web3-react'

import { updateNetwork, updateAccount, initialize, startWatching } from '../ducks/web3connect'
import { setAddresses } from '../ducks/addresses'
import Header from '../components/Header'

import './App.scss'

const Swap = lazy(() => import('./Swap'))
const Send = lazy(() => import('./Send'))
const Pool = lazy(() => import('./Pool'))

const { Connector, InjectedConnector } = Connectors

function App({ initialized, setAddresses, updateNetwork, updateAccount, initialize, startWatching }) {
  const context = useWeb3Context()

  // start web3-react on page-load
  useEffect(() => {
    context.setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
        context.setError(error, { connectorName: 'Injected' })
      } else {
        context.setConnector('Infura')
      }
    })
  }, [])

  // if the metamask user logs out, set the infura provider
  useEffect(() => {
    if (context.error && context.error.code === InjectedConnector.errorCodes.UNLOCK_REQUIRED) {
      context.setConnector('Infura')
    }
  }, [context.connectorName, context.error])

  // initialize redux network
  const [reduxNetworkInitialized, setReduxNetworkInitialized] = useState(false)
  useEffect(() => {
    if (context.active) {
      setAddresses(context.networkId)
      updateNetwork(context.library._web3Provider, context.networkId)
      setReduxNetworkInitialized(true)
    }
  }, [context.active, context.networkId])

  // initialize redux account
  const [reduxAccountInitialized, setReduxAccountInitialized] = useState(false)
  useEffect(() => {
    if (context.active) {
      updateAccount(context.account)
      setReduxAccountInitialized(true)
    }
  }, [context.active, context.account])

  // initialize redux
  useEffect(() => {
    if (reduxNetworkInitialized && reduxAccountInitialized) {
      initialize().then(startWatching)
    }
  }, [reduxNetworkInitialized, reduxAccountInitialized])

  // active state
  if (initialized || context.error) {
    return (
      <div id="app-container">
        <Header />
        {!!(initialized && context.active && context.account) && (
          <div className="app__wrapper">
            <BrowserRouter>
              <Suspense fallback={null}>
                <Switch>
                  <Route exact strict path="/swap" component={Swap} />
                  <Route exact strict path="/send" component={Send} />
                  <Route exact strict path="/add-liquidity" component={Pool} />
                  <Route exact strict path="/remove-liquidity" component={Pool} />
                  <Route exact strict path="/create-exchange/:tokenAddress?" component={Pool} />
                  <Redirect to="/swap" />
                </Switch>
              </Suspense>
            </BrowserRouter>
          </div>
        )}
      </div>
    )
  }

  // loading state
  return null
}

export default connect(
  state => ({
    initialized: state.web3connect.initialized
  }),
  dispatch => ({
    setAddresses: networkId => dispatch(setAddresses(networkId)),
    updateNetwork: (passedProvider, networkId) => dispatch(updateNetwork(passedProvider, networkId)),
    updateAccount: account => dispatch(updateAccount(account)),
    initialize: () => dispatch(initialize()),
    startWatching: () => dispatch(startWatching())
  })
)(App)
