import React, { useEffect } from 'react'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useWeb3Context, Connectors } from 'web3-react'

import NavigationTabs from '../components/NavigationTabs'
import Header from '../components/Header'
import Swap from './Swap'
import Send from './Send'
import Pool from './Pool'

import './App.scss'

const { Connector, InjectedConnector } = Connectors

export default function App() {
  const { setConnector, setError, error, active, connectorName } = useWeb3Context()

  // start web3-react on page-load
  useEffect(() => {
    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
        setError(error, { connectorName: 'Injected' })
      } else {
        setConnector('Infura')
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // if the metamask user logs out, set the infura provider
  useEffect(() => {
    if (error && error.code === InjectedConnector.errorCodes.UNLOCK_REQUIRED) {
      setConnector('Infura')
    }
  }, [error, connectorName, setConnector])

  // active state
  if (active || error) {
    return (
      <div id="app-container">
        <Header />
        {/* this is an intermediate state before infura is set */}
        {(!error || error.code === InjectedConnector.errorCodes.UNLOCK_REQUIRED) && (
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
