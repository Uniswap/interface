import '@reach/dialog/styles.css'
import 'inter-ui'
import 'polyfills'
import 'components/analytics'

import { ApolloProvider } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { FeatureFlagsProvider } from 'featureFlags'
import { apolloClient } from 'graphql/data/apollo'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { StatsigProvider } from 'statsig-react'
import { getEnvName, isSentryEnabled } from 'utils/env'

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

const STATSIG_DUMMY_KEY = 'client-0000000000000000000000000000000000000000000'
const STATSIG_PROXY_URL = process.env.REACT_APP_STATSIG_PROXY_URL

const Main = () => {
  const user = useMemo(() => ({}), [])
  return (
    <StrictMode>
      <Provider store={store}>
        <FeatureFlagsProvider>
          <QueryClientProvider client={queryClient}>
            <HashRouter>
              <LanguageProvider>
                <Web3Provider>
                  <ApolloProvider client={apolloClient}>
                    <BlockNumberProvider>
                      <StatsigProvider
                        user={user}
                        // TODO: replace with proxy and cycle key
                        sdkKey={STATSIG_DUMMY_KEY}
                        waitForInitialization={false}
                        options={{
                          environment: { tier: getEnvName() },
                          api: STATSIG_PROXY_URL,
                        }}
                      >
                        <Updaters />
                        <ThemeProvider>
                          <ThemedGlobalStyle />
                          <App />
                        </ThemeProvider>
                      </StatsigProvider>
                    </BlockNumberProvider>
                  </ApolloProvider>
                </Web3Provider>
              </LanguageProvider>
            </HashRouter>
          </QueryClientProvider>
        </FeatureFlagsProvider>
      </Provider>
    </StrictMode>
  )
}

createRoot(container).render(<Main />)

if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
  serviceWorkerRegistration.register()
}
