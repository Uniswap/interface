// Ordering is intentional and must be preserved: sideEffects followed by functionality.
import 'sideEffects'

import { getDeviceId } from '@amplitude/analytics-browser'
import { ApolloProvider } from '@apollo/client'
import { PortalProvider } from '@tamagui/portal'
import { QueryClientProvider } from '@tanstack/react-query'
import Web3Provider from 'components/Web3Provider'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
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
import PoolListUpdater from 'state/lists/poolsList/updater'
import ListsUpdater from 'state/lists/updater'
import LogsUpdater from 'state/logs/updater'
import { StatsigProvider as BaseStatsigProvider, StatsigUser } from 'statsig-react'
import { ThemeProvider, ThemedGlobalStyle } from 'theme'
import RadialGradientByChainUpdater from 'theme/components/RadialGradientByChainUpdater'
import { SystemThemeUpdater, ThemeColorMetaUpdater } from 'theme/components/ThemeToggle'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { getEnvName } from 'tracing/env'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { DUMMY_STATSIG_SDK_KEY } from 'uniswap/src/features/gating/constants'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
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
      <PoolListUpdater />
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

const container = document.getElementById('root') as HTMLElement

const Router = isBrowserRouterEnabled() ? BrowserRouter : HashRouter

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={SharedQueryClient}>
          <Router>
            <LanguageProvider>
              <Web3Provider>
                <StatsigProvider>
                  <WebUniswapProvider>
                    <GraphqlProviders>
                      <LocalizationContextProvider>
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
                      </LocalizationContextProvider>
                    </GraphqlProviders>
                  </WebUniswapProvider>
                </StatsigProvider>
              </Web3Provider>
            </LanguageProvider>
          </Router>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </StrictMode>,
)

// We once had a ServiceWorker, and users who have not visited since then may still have it registered.
// This ensures it is truly gone.
unregisterServiceWorker()
