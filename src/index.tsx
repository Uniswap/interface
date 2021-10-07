import './log-addresses'

import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { NetworkContextName } from './constants'
import './i18n'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import MulticallUpdater from './state/multicall/updater'
import FeesUpdater from './state/fees/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import TokenListUpdater from './state/lists/updater'
import MultiChainLinksUpdater from './state/multi-chain-links/updater'
import ClaimUpdater from './state/claim/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
import getLibrary from './utils/getLibrary'
import { BridgeProvider } from './contexts/BridgeProvider'
import BridgeTransactionsUpdater from './state/bridgeTransactions/updater'
const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

if ('ethereum' in window) {
  ;(window.ethereum as any).autoRefreshOnNetworkChange = false
}

window.addEventListener('error', error => {
  console.error(`${error.message} @ ${error.filename}:${error.lineno}:${error.colno}`)
})

function Updaters() {
  return (
    <>
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <BridgeTransactionsUpdater />
      <MulticallUpdater />
      <FeesUpdater />
      <TokenListUpdater />
      <ClaimUpdater />
    </>
  )
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <BridgeProvider>
            <Updaters />
            <ThemeProvider>
              <ThemedGlobalStyle />
              <HashRouter>
                <MultiChainLinksUpdater />
                <App />
              </HashRouter>
            </ThemeProvider>
          </BridgeProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </StrictMode>,
  document.getElementById('root')
)
