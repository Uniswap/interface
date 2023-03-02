// import '@reach/dialog/styles.css'
import 'inter-ui'
import '../src/polyfills'

// import '../src/components/analytics'
import { ApolloProvider } from '@apollo/client'
import React, { useEffect, useState } from 'react'
import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'

import Web3Provider from '../src/components/Web3Provider'
import { FeatureFlagsProvider } from '../src/featureFlags'
import { apolloClient } from '../src/graphql/data/apollo'
import { LanguageProvider } from '../src/i18n'
import { BlockNumberProvider } from '../src/lib/hooks/useBlockNumber'
import { MulticallUpdater } from '../src/lib/state/multicall'
import App from '../src/pages/App'
import store from '../src/state'
import ApplicationUpdater from '../src/state/application/updater'
import ListsUpdater from '../src/state/lists/updater'
import LogsUpdater from '../src/state/logs/updater'
import TransactionUpdater from '../src/state/transactions/updater'
import UserUpdater from '../src/state/user/updater'
import ThemeProvider, { ThemedGlobalStyle } from '../src/theme'
import RadialGradientByChainUpdater from '../src/theme/components/RadialGradientByChainUpdater'

// if (typeof window !== 'undefined') {
//   // window.ethereum.autoRefreshOnNetworkChange = false
//   if (isSentryEnable()) {
//     Sentry.init({
//       dsn: process.env.REACT_APP_SENTRY_DSN,
//       release: process.env.REACT_APP_GIT_COMMIT_HASH,
//     })
//   }
// }

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

// eslint-disable-next-line import/no-unused-modules
export default function Main() {
  /**
   * TODO(XXXX)
   * We're using a catch-all route for maximum compatibility with existing React Router.
   * As a next step, we should migrate to Next file-based router and remove the following
   * to generate more HTML on build time.
   * https://nextjs.org/docs/migrating/from-create-react-app#single-page-app-spa
   */
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

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
        </FeatureFlagsProvider>
      </Provider>
    </StrictMode>
  )
}
