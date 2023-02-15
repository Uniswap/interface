import '@reach/dialog/styles.css'
import 'inter-ui'
import 'polyfills'
import 'components/analytics'

import { ApolloProvider } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { getDeviceId, getSessionId, initializeAnalytics, OriginApplication } from '@uniswap/analytics'
import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlagsProvider } from 'featureFlags'
import { apolloClient } from 'graphql/data/apollo'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { StatsigProvider } from 'statsig-react'
import { getEnvName, isProductionEnv, isSentryEnabled } from 'utils/env'

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
import RadialGradientByChainUpdater from './theme/components/RadialGradientByChainUpdater'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

if (isSentryEnabled()) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: process.env.REACT_APP_GIT_COMMIT_HASH,
  })
}

// Placeholder API key. Actual API key used in the proxy server
const ANALYTICS_DUMMY_KEY = '00000000000000000000000000000000'
const ANALYTICS_PROXY_URL = process.env.REACT_APP_AMPLITUDE_PROXY_URL
const COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH
initializeAnalytics(ANALYTICS_DUMMY_KEY, OriginApplication.INTERFACE, {
  proxyUrl: ANALYTICS_PROXY_URL,
  defaultEventName: SharedEventName.PAGE_VIEWED,
  commitHash: COMMIT_HASH,
  isProductionEnv: isProductionEnv(),
})

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

const queryClient = new QueryClient()

const container = document.getElementById('root') as HTMLElement

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <FeatureFlagsProvider>
        <StatsigProvider
          user={{
            userID: getDeviceId(),
            customIDs: { session_id: String(getSessionId() ?? -1) },
          }}
          // TODO: replace with proxy and cycle key
          sdkKey="client-1rY92WZGidd2hgW4x1lsZ7afqm1Qfr3sJfH3A5b8eJa"
          waitForInitialization={true}
          options={{
            environment: { tier: getEnvName() },
          }}
        >
          <QueryClientProvider client={queryClient}>
            <HashRouter>
              <LanguageProvider>
                <Web3Provider>
                  <ApolloProvider client={apolloClient}>
                    <BlockNumberProvider>
                      <Updaters />
                      <ThemeProvider>
                        <ThemedGlobalStyle />
                        <App />
                      </ThemeProvider>
                    </BlockNumberProvider>
                  </ApolloProvider>
                </Web3Provider>
              </LanguageProvider>
            </HashRouter>
          </QueryClientProvider>
        </StatsigProvider>
      </FeatureFlagsProvider>
    </Provider>
  </StrictMode>
)

if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
  serviceWorkerRegistration.register()
}
