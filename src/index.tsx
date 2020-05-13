import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { Provider } from 'react-redux'

import { NetworkContextName } from './constants'
import { isMobile } from 'react-device-detect'
import WalletUpdater from './state/wallet/updater'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
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

function Updaters() {
  return (
    <>
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <WalletUpdater />
    </>
  )
}

ReactDOM.render(
  <>
    <FixedGlobalStyle />
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <Updaters />
          <ThemeProvider>
            <>
              <ThemedGlobalStyle />
              <App />
            </>
          </ThemeProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </>,
  document.getElementById('root')
)
