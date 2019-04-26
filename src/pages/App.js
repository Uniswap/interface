import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useWeb3Context } from 'web3-react'
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal'

import NavigationTabs from '../components/NavigationTabs'
import { updateNetwork, updateAccount, initialize, startWatching } from '../ducks/web3connect'
import { setAddresses } from '../ducks/addresses'
import Header from '../components/Header'
import Swap from './Swap'
import Send from './Send'
import Pool from './Pool'

import './App.scss'

function App({ initialized, setAddresses, updateNetwork, updateAccount, initialize, startWatching }) {
  const context = useWeb3Context()

  // start web3-react on page-load
  useEffect(() => {
    context.setConnector('WalletConnect')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (context.active && context.connectorName === 'WalletConnect') {
    if (!context.account) {
      WalletConnectQRCodeModal.open(context.connector.walletConnector.uri, () => {})
    } else {
      try {
        WalletConnectQRCodeModal.close()
      } catch {}
    }
  }

  // initialize redux network
  const [reduxNetworkInitialized, setReduxNetworkInitialized] = useState(false)
  useEffect(() => {
    if (context.active) {
      setAddresses(context.networkId)
      updateNetwork(context.library._web3Provider, context.networkId)
      setReduxNetworkInitialized(true)
    }
  }, [context.active, context.networkId, context.library]) // eslint-disable-line react-hooks/exhaustive-deps

  // initialize redux account
  const [reduxAccountInitialized, setReduxAccountInitialized] = useState(false)
  useEffect(() => {
    if (context.active) {
      updateAccount(context.account)
      setReduxAccountInitialized(true)
    }
  }, [context.active, context.account]) // eslint-disable-line react-hooks/exhaustive-deps

  // initialize redux
  useEffect(() => {
    if (reduxNetworkInitialized && reduxAccountInitialized) {
      initialize().then(startWatching)
    }
  }, [reduxNetworkInitialized, reduxAccountInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  // active state
  if (initialized || context.error) {
    return (
      <div id="app-container">
        <Header />
        {/* this is an intermediate state before infura is set */}
        {initialized && !context.error && (
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
