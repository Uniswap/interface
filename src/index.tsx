import './i18n'

import { ChainId } from '@ubeswap/sdk'
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import { NETWORK_CHAIN_ID } from 'connectors'
import React, { StrictMode } from 'react'
import { isMobile } from 'react-device-detect'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'

import { NetworkContextName } from './constants'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
import getLibrary from './utils/getLibrary'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

if (window.celo) {
  window.celo.autoRefreshOnNetworkChange = false
}

const GOOGLE_ANALYTICS_IDS = {
  production: {
    [ChainId.MAINNET]: 'UA-189817928-4',
    [ChainId.ALFAJORES]: 'UA-189817928-5',
    [ChainId.BAKLAVA]: 'UA-189817928-6',
  },
  staging: {
    [ChainId.MAINNET]: 'UA-189817928-2',
    [ChainId.ALFAJORES]: 'UA-189817928-3',
    [ChainId.BAKLAVA]: 'UA-189817928-7',
  },
}

const environment = window.location.hostname.includes('app-staging')
  ? 'staging'
  : window.location.hostname.includes('ubeswap.org')
  ? 'production'
  : null

const GOOGLE_ANALYTICS_ID = environment ? GOOGLE_ANALYTICS_IDS[environment][NETWORK_CHAIN_ID] : null

if (GOOGLE_ANALYTICS_ID) {
  console.log(`Initializing GA at ${GOOGLE_ANALYTICS_ID} (${environment} ${NETWORK_CHAIN_ID})`)
  ReactGA.initialize(GOOGLE_ANALYTICS_ID)
  ReactGA.set({
    customBrowserType: !isMobile ? 'desktop' : 'web3' in window || 'celo' in window ? 'mobileWeb3' : 'mobileRegular',
  })
} else {
  console.log(`Could not initialize GA (${environment} ${NETWORK_CHAIN_ID})`)
  ReactGA.initialize('test', { testMode: true, debug: true })
}

window.addEventListener('error', (error) => {
  ReactGA.exception({
    description: `${error.message} @ ${error.filename}:${error.lineno}:${error.colno}`,
    fatal: true,
  })
})

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
    </>
  )
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <Updaters />
          <ThemeProvider>
            <ThemedGlobalStyle />
            <HashRouter>
              <App />
            </HashRouter>
          </ThemeProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </StrictMode>,
  document.getElementById('root')
)
