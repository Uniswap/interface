// Ordering is intentional and must be preserved: styling, polyfilling, tracing, and then functionality.
// prettier-ignore
import '@reach/dialog/styles.css'
// prettier-ignore
import 'inter-ui'
// prettier-ignore
import 'polyfills'
// prettier-ignore
import 'tracing'
// ensure translations load before things
// prettier-ignore
import 'i18n'
// prettier-ignore
import 'setupRive'

import { getDeviceId } from '@amplitude/analytics-browser'
import { ApolloProvider } from '@apollo/client'
import { PortalProvider } from '@tamagui/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Web3Provider from 'components/Web3Provider'
import { AssetActivityProvider } from 'graphql/data/apollo/AssetActivityProvider'
import { TokenBalancesProvider } from 'graphql/data/apollo/TokenBalancesProvider'
import { apolloClient } from 'graphql/data/apollo/client'
import { useAccount } from 'hooks/useAccount'
import { LanguageProvider } from 'i18n/LanguageProvider'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import App from 'pages/App'
import { PropsWithChildren, StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async/lib/index'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, useLocation } from 'react-router-dom'
import store from 'state'
import { ActivityStateUpdater } from 'state/activity/updater'
import ApplicationUpdater from 'state/application/updater'
import FiatOnRampTransactionsUpdater from 'state/fiatOnRampTransactions/updater'
import ListsUpdater from 'state/lists/updater'
import LogsUpdater from 'state/logs/updater'
import { StatsigProvider as BaseStatsigProvider, StatsigUser } from 'statsig-react'
import { ThemeProvider, ThemedGlobalStyle } from 'theme'
import RadialGradientByChainUpdater from 'theme/components/RadialGradientByChainUpdater'
import { SystemThemeUpdater, ThemeColorMetaUpdater } from 'theme/components/ThemeToggle'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { DUMMY_STATSIG_SDK_KEY } from 'uniswap/src/features/gating/constants'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import { getEnvName } from 'utilities/src/environment'
import { isBrowserRouterEnabled } from 'utils/env'
import { unregister as unregisterServiceWorker } from 'utils/serviceWorker'
import { getCanonicalUrl } from 'utils/urlRoutes'

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
      <FiatOnRampTransactionsUpdater />
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
  const account = useAccount()
  const statsigUser: StatsigUser = useMemo(
    () => ({
      userID: getDeviceId(),
      customIDs: { address: account.address ?? '' },
    }),
    [account.address],
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
  <OptionalStrictMode>
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
                            <PortalProvider>
                              <ThemedGlobalStyle />
                              <App />
                            </PortalProvider>
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
  </OptionalStrictMode>,
)

// TODO(EXT-1229): We had to remove `React.StrictMode` because it's not
// currently supported by Reanimated Web. We should consider re-enabling
// once Reanimated fixes this.
function OptionalStrictMode(props: { children: React.ReactNode }): JSX.Element {
  return process.env.ENABLE_STRICT_MODE ? <StrictMode>{props.children}</StrictMode> : <>{props.children}</>
}

// We once had a ServiceWorker, and users who have not visited since then may still have it registered.
// This ensures it is truly gone.
unregisterServiceWorker()
