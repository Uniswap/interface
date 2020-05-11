import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import { NetworkContextName } from './constants'
import { isMobile } from 'react-device-detect'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'
import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
import BalancesContextProvider, { Updater as BalancesContextUpdater } from './contexts/Balances'
import App from './pages/App'
import ThemeProvider, { GlobalStyle } from './theme'
import './i18n'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

function getLibrary(provider): Web3Provider {
  const library = new Web3Provider(provider)
  library.pollingInterval = 10000
  return library
}

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_ID)
  ReactGA.set({
    customBrowserType: !isMobile ? 'desktop' : 'web3' in window || 'ethereum' in window ? 'mobileWeb3' : 'mobileRegular'
  })
} else {
  ReactGA.initialize('test', { testMode: true, debug: true })
}

ReactGA.pageview(window.location.pathname + window.location.search)

function ContextProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocalStorageContextProvider>
      <ApplicationContextProvider>
        <TransactionContextProvider>
          <BalancesContextProvider>{children}</BalancesContextProvider>
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
