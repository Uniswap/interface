// Ordering is intentional and must be preserved: sideEffects followed by functionality.
import 'sideEffects'

import { getDeviceId } from '@amplitude/analytics-browser'
import { ApolloProvider } from '@apollo/client'
import { datadogRum } from '@datadog/browser-rum'
import { PortalProvider } from '@tamagui/portal'
import { QueryClientProvider } from '@tanstack/react-query'
import Web3Provider, { Web3ProviderUpdater } from 'components/Web3Provider'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
import { AssetActivityProvider } from 'graphql/data/apollo/AssetActivityProvider'
import { TokenBalancesProvider } from 'graphql/data/apollo/TokenBalancesProvider'
import { apolloClient } from 'graphql/data/apollo/client'
import { useAccount } from 'hooks/useAccount'
import { LanguageProvider } from 'i18n/LanguageProvider'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import App from 'pages/App'
import { PropsWithChildren, StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async/lib/index'
import { I18nextProvider } from 'react-i18next'
import { configureReanimatedLogger } from 'react-native-reanimated'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, useLocation } from 'react-router-dom'
import store from 'state'
import { ActivityStateUpdater } from 'state/activity/updater'
import ApplicationUpdater from 'state/application/updater'
import FiatOnRampTransactionsUpdater from 'state/fiatOnRampTransactions/updater'
import ListsUpdater from 'state/lists/updater'
import LogsUpdater from 'state/logs/updater'
import { ThemeProvider, ThemedGlobalStyle } from 'theme'
import { SystemThemeUpdater, ThemeColorMetaUpdater } from 'theme/components/ThemeToggle'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { isDevEnv, isTestEnv } from 'utilities/src/environment/env'
import { isBrowserRouterEnabled } from 'utils/env'
import { unregister as unregisterServiceWorker } from 'utils/serviceWorker'
import { getCanonicalUrl } from 'utils/urlRoutes'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

if (__DEV__ && !isTestEnv()) {
  configureReanimatedLogger({
    strict: false,
  })
}

function Updaters() {
  const location = useLocation()

  return (
    <>
      <Helmet>
        <link rel="canonical" href={getCanonicalUrl(location.pathname)} />
      </Helmet>
      <ListsUpdater />
      <SystemThemeUpdater />
      <ThemeColorMetaUpdater />
      <ApplicationUpdater />
      <ActivityStateUpdater />
      <LogsUpdater />
      <FiatOnRampTransactionsUpdater />
      <Web3ProviderUpdater />
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

  useEffect(() => {
    datadogRum.setUserProperty('connection', {
      type: account.connector?.type,
      name: account.connector?.name,
      rdns: account.connector?.id,
      address: account.address,
      status: account.status,
    })
  }, [account])

  const onStatsigInit = () => {
    const isDatadogEnabled = getFeatureFlag(FeatureFlags.Datadog)
    if (isDatadogEnabled && !isDevEnv()) {
      initializeDatadog('web').catch(() => undefined)
    }
  }

  return (
    <StatsigProviderWrapper user={statsigUser} onInit={onStatsigInit}>
      {children}
    </StatsigProviderWrapper>
  )
}

const container = document.getElementById('root') as HTMLElement

const Router = isBrowserRouterEnabled() ? BrowserRouter : HashRouter

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      <ReactRouterUrlProvider>
        <Provider store={store}>
          <QueryClientProvider client={SharedQueryClient}>
            <Router>
              <I18nextProvider i18n={i18n}>
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
              </I18nextProvider>
            </Router>
          </QueryClientProvider>
        </Provider>
      </ReactRouterUrlProvider>
    </HelmetProvider>
  </StrictMode>,
)

// We once had a ServiceWorker, and users who have not visited since then may still have it registered.
// This ensures it is truly gone.
unregisterServiceWorker()
