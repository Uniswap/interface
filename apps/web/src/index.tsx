/* eslint-disable prettier/prettier */
// Ordering is intentional and must be preserved: styling, polyfilling, tracing, and then functionality.
import '@reach/dialog/styles.css'
import 'inter-ui'
import 'polyfills'
import 'tracing'
import 'connection/eagerlyConnect'
/* eslint-enable prettier/prettier */

import { ApolloProvider } from '@apollo/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWeb3React } from '@web3-react/core'
import { getDeviceId } from 'analytics'
import { AssetActivityProvider } from 'graphql/data/apollo/AssetActivityProvider'
import { TokenBalancesProvider } from 'graphql/data/apollo/TokenBalancesProvider'
import { apolloClient } from 'graphql/data/apollo/client'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import { PropsWithChildren, StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async/lib/index'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, useLocation } from 'react-router-dom'
import { ActivityStateUpdater } from 'state/activity/updater'
import { StatsigProvider as BaseStatsigProvider, StatsigUser } from 'statsig-react'
import { SystemThemeUpdater, ThemeColorMetaUpdater } from 'theme/components/ThemeToggle'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { DUMMY_STATSIG_SDK_KEY } from 'uniswap/src/features/gating/constants'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import { getEnvName, isBrowserRouterEnabled } from 'utils/env'
import { unregister as unregisterServiceWorker } from 'utils/serviceWorker'
import { getCanonicalUrl } from 'utils/urlRoutes'
import Web3Provider from './components/Web3Provider'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import LogsUpdater from './state/logs/updater'
import { ThemeProvider, ThemedGlobalStyle } from './theme'
import RadialGradientByChainUpdater from './theme/components/RadialGradientByChainUpdater'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  const location = useLocation()

  return (
    <>
      <Helmet>
        <link rel="canonical" href={getCanonicalUrl(location.pathname)} />
      </Helmet>
      <RadialGradientByChainUpdater />
      <ListsUpdater />
      <SystemThemeUpdater />
      <ThemeColorMetaUpdater />
      <ApplicationUpdater />
      <ActivityStateUpdater />
      <MulticallUpdater />
      <LogsUpdater />
    </>
  )
}

function GraphqlProviders({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AssetActivityProvider>
        <TokenBalancesProvider>{children}</TokenBalancesProvider>
      </AssetActivityProvider>
    </ApolloProvider>
  )
}
function StatsigProvider({ children }: PropsWithChildren) {
  const { account } = useWeb3React()
  const statsigUser: StatsigUser = useMemo(
    () => ({
      userID: getDeviceId(),
      customIDs: { address: account ?? '' },
    }),
    [account]
  )
  return (
    <BaseStatsigProvider
      user={statsigUser}
      sdkKey={DUMMY_STATSIG_SDK_KEY}
      waitForInitialization={false}
      options={{
        environment: { tier: getEnvName() },
        api: process.env.REACT_APP_STATSIG_PROXY_URL,
        disableAutoMetricsLogging: true,
        disableErrorLogging: true,
      }}
    >
      {children}
    </BaseStatsigProvider>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 20, // 20 seconds
    },
  },
})

const container = document.getElementById('root') as HTMLElement

const Router = isBrowserRouterEnabled() ? BrowserRouter : HashRouter

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <LanguageProvider>
              <Web3Provider>
                <StatsigProvider>
                  <GraphqlProviders>
                    <BlockNumberProvider>
                      <UnitagUpdaterContextProvider>
                        <Updaters />
                        <ThemeProvider>
                          <TamaguiProvider>
                            <ThemedGlobalStyle />
                            <App />
                          </TamaguiProvider>
                        </ThemeProvider>
                      </UnitagUpdaterContextProvider>
                    </BlockNumberProvider>
                  </GraphqlProviders>
                </StatsigProvider>
              </Web3Provider>
            </LanguageProvider>
          </Router>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </StrictMode>
)

// We once had a ServiceWorker, and users who have not visited since then may still have it registered.
// This ensures it is truly gone.
unregisterServiceWorker()
