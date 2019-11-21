import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import App from './pages/App'
import './i18n'

import ThemeProvider, { GlobalStyle } from './theme'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'
import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
import TokensContextProvider from './contexts/Tokens'
import BalancesContextProvider from './contexts/Balances'
import AllowancesContextProvider from './contexts/Allowances'
import AllBalancesContextProvider from './contexts/AllBalances'
import WalletModalContextProvider from './contexts/Wallet'

import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'

function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider)
  library.pollingInterval = 10000
  return library
}

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
} else {
  ReactGA.initialize('test', { testMode: true })
}
ReactGA.pageview(window.location.pathname + window.location.search)

function ContextProviders({ children }) {
  return (
    <LocalStorageContextProvider>
      <ApplicationContextProvider>
        <TransactionContextProvider>
          <TokensContextProvider>
            <WalletModalContextProvider>
              <BalancesContextProvider>
                <AllBalancesContextProvider>
                  <AllowancesContextProvider>{children}</AllowancesContextProvider>
                </AllBalancesContextProvider>
              </BalancesContextProvider>
            </WalletModalContextProvider>
          </TokensContextProvider>
        </TransactionContextProvider>
      </ApplicationContextProvider>
    </LocalStorageContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <LocalStorageContextUpdater />
      <ApplicationContextUpdater />
      <TransactionContextUpdater />
    </>
  )
}

ReactDOM.render(
  <Web3ReactProvider getLibrary={getLibrary}>
    <ContextProviders>
      <Updaters />
      <ThemeProvider>
        <>
          <GlobalStyle />
          <App />
        </>
      </ThemeProvider>
    </ContextProviders>
  </Web3ReactProvider>,
  document.getElementById('root')
)
