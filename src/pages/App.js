import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useWeb3Context, Connectors } from 'web3-react'

import NavigationTabs from '../components/NavigationTabs'
import { updateNetwork, updateAccount, initialize, startWatching } from '../ducks/web3connect'
import { setAddresses } from '../ducks/addresses'
import Header from '../components/Header'
import Swap from './Swap'
import Send from './Send'
import Pool from './Pool'

import './App.scss'

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
  }, [context.error, context.connectorName])

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
        {/* this is an intermediate state before infura is set */}
        {initialized && (!context.error || context.error.code === InjectedConnector.errorCodes.UNLOCK_REQUIRED) && (
          <div className="app__wrapper">
            <div className="body">
              <div className="body__content">
                <BrowserRouter>
                  <NavigationTabs />
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
                </BrowserRouter>
              </div>
            </div>
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
