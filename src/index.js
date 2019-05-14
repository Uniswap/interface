import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import Web3Provider, { Connectors } from 'web3-react'

import ThemeProvider, { GlobalStyle } from './theme'
import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
import TokensContextProvider from './contexts/Tokens'
import BalancesContextProvider from './contexts/Balances'
import AllowancesContextProvider from './contexts/Allowances'

import App from './pages/App'

import './i18n'

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
} else {
  ReactGA.initialize('test', { testMode: true })
}
ReactGA.pageview(window.location.pathname + window.location.search)

const { InjectedConnector, NetworkOnlyConnector } = Connectors
const Injected = new InjectedConnector({ supportedNetworks: [Number(process.env.REACT_APP_NETWORK_ID) || 1] })
const Infura = new NetworkOnlyConnector({
  providerURL: process.env.REACT_APP_NETWORK_URL || ''
})
const connectors = { Injected, Infura }

function ContextProviders({ children }) {
  return (
    <ApplicationContextProvider>
      <TransactionContextProvider>
        <TokensContextProvider>
          <BalancesContextProvider>
            <AllowancesContextProvider>{children}</AllowancesContextProvider>
          </BalancesContextProvider>
        </TokensContextProvider>
      </TransactionContextProvider>
    </ApplicationContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <ApplicationContextUpdater />
      <TransactionContextUpdater />
    </>
  )
}

ReactDOM.render(
  <ThemeProvider>
    <>
      <GlobalStyle />
      <Web3Provider connectors={connectors} libraryName="ethers.js">
        <ContextProviders>
          <Updaters />
          <App />
        </ContextProviders>
      </Web3Provider>
    </>
  </ThemeProvider>,
  document.getElementById('root')
)
