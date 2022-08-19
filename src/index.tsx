import '@reach/dialog/styles.css'
import 'inter-ui'
import 'polyfills'
import 'components/analytics'

import { FeatureFlagsProvider } from 'featureFlags'
import RelayEnvironment from 'graphql/data/RelayEnvironment'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { RelayEnvironmentProvider } from 'react-relay'
import { HashRouter } from 'react-router-dom'

import Blocklist from './components/Blocklist'
import Web3Provider from './components/Web3Provider'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import LogsUpdater from './state/logs/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { ThemedGlobalStyle } from './theme'
import RadialGradientByChainUpdater from './theme/RadialGradientByChainUpdater'

const queryClient = new QueryClient()

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  return (
    <>
      <RadialGradientByChainUpdater />
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <LogsUpdater />
    </>
  )
}

const container = document.getElementById('root') as HTMLElement

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <FeatureFlagsProvider>
        <QueryClientProvider client={queryClient}>
          <HashRouter>
            <LanguageProvider>
              <Web3Provider>
                <RelayEnvironmentProvider environment={RelayEnvironment}>
                  <Blocklist>
                    <BlockNumberProvider>
                      <Updaters />
                      <ThemeProvider>
                        <ThemedGlobalStyle />
                        <App />
                      </ThemeProvider>
                    </BlockNumberProvider>
                  </Blocklist>
                </RelayEnvironmentProvider>
              </Web3Provider>
            </LanguageProvider>
          </HashRouter>
        </QueryClientProvider>
      </FeatureFlagsProvider>
    </Provider>
  </StrictMode>
)

if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
  serviceWorkerRegistration.register()
}
