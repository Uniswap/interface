import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { ethers } from 'ethers'

import { NetworkContextName } from './constants'
import { isMobile } from 'react-device-detect'
import LocalStorageContextProvider from './contexts/LocalStorage'
import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
import BalancesContextProvider, { Updater as BalancesContextUpdater } from './contexts/Balances'
import ExchangesContextProvider from './contexts/Pairs'
import AllowancesContextProvider from './contexts/Allowances'
import RoutesContextProvider from './contexts/Routes'
import App from './pages/App'
import ThemeProvider, { GlobalStyle } from './theme'
import './i18n'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider)
  library.pollingInterval = 10000
  return library
}

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
  ReactGA.set({
    customBrowserType: !isMobile ? 'desktop' : window.web3 || window.ethereum ? 'mobileWeb3' : 'mobileRegular'
  })
} else {
  ReactGA.initialize('test', { testMode: true })
}

ReactGA.pageview(window.location.pathname + window.location.search)

function ContextProviders({ children }) {
  return (
    <LocalStorageContextProvider>
      <ApplicationContextProvider>
        <TransactionContextProvider>
          <ExchangesContextProvider>
            <RoutesContextProvider>
              <BalancesContextProvider>
                <AllowancesContextProvider>{children}</AllowancesContextProvider>
              </BalancesContextProvider>
            </RoutesContextProvider>
          </ExchangesContextProvider>
        </TransactionContextProvider>
      </ApplicationContextProvider>
    </LocalStorageContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <ApplicationContextUpdater />
      <TransactionContextUpdater />
      <BalancesContextUpdater />
    </>
  )
}

ReactDOM.render(
  <Web3ReactProvider getLibrary={getLibrary}>
    <Web3ProviderNetwork getLibrary={getLibrary}>
      <ContextProviders>
        <Updaters />
        <ThemeProvider>
          <>
            <GlobalStyle />
            <App />
          </>
        </ThemeProvider>
      </ContextProviders>
    </Web3ProviderNetwork>
  </Web3ReactProvider>,
  document.getElementById('root')
)
