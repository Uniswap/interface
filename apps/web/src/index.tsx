// Ordering is intentional and must be preserved: sideEffects followed by functionality.
import 'sideEffects'

import { AssetActivityProvider } from 'appGraphql/data/apollo/AssetActivityProvider'
import { apolloClient } from 'appGraphql/data/apollo/client'
import { TokenBalancesProvider } from 'appGraphql/data/apollo/TokenBalancesProvider'
import { getDeviceId } from '@amplitude/analytics-browser'
import { ApolloProvider } from '@apollo/client'
import { datadogRum } from '@datadog/browser-rum'
import type { StatsigUser } from '@universe/gating'
import { QueryClientPersistProvider } from 'components/PersistQueryClient'
import { createWeb3Provider } from 'components/Web3Provider/createWeb3Provider'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { AccountsStoreDevTool } from 'features/accounts/store/devtools'
import { WebAccountsStoreProvider } from 'features/accounts/store/provider'
import { ConnectWalletMutationProvider } from 'features/wallet/connection/hooks/useConnectWalletMutation'
import { ExternalWalletProvider } from 'features/wallet/providers/ExternalWalletProvider'
import { useAccount } from 'hooks/useAccount'
import { useDeferredComponent } from 'hooks/useDeferredComponent'
import { LanguageProvider } from 'i18n/LanguageProvider'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import App from 'pages/App'
import type { PropsWithChildren } from 'react'
import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async/lib/index'
import { I18nextProvider } from 'react-i18next'
import { configureReanimatedLogger } from 'react-native-reanimated'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, useLocation } from 'react-router'
import store from 'state'
import { ThemedGlobalStyle, ThemeProvider } from 'theme'
import { TamaguiProvider } from 'theme/tamaguiProvider'
import { PortalProvider } from 'ui/src'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { initializePortfolioQueryOverrides } from 'uniswap/src/data/rest/portfolioBalanceOverrides'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import i18n from 'uniswap/src/i18n'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { localDevDatadogEnabled } from 'utilities/src/environment/constants'
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

initializePortfolioQueryOverrides({ store })

const loadListsUpdater = () => import('state/lists/updater')
const loadSystemThemeUpdater = () =>
  import('theme/components/ThemeToggle').then((m) => ({ default: m.SystemThemeUpdater }))
const loadThemeColorMetaUpdater = () =>
  import('theme/components/ThemeToggle').then((m) => ({ default: m.ThemeColorMetaUpdater }))
const loadApplicationUpdater = () => import('state/application/updater')
const loadActivityStateUpdater = () =>
  import('state/activity/updater').then((m) => ({ default: m.ActivityStateUpdater }))
const loadLogsUpdater = () => import('state/logs/updater')
const loadFiatOnRampTransactionsUpdater = () => import('state/fiatOnRampTransactions/updater')
const loadWebAccountsStoreUpdater = () =>
  import('features/accounts/store/updater').then((m) => ({ default: m.WebAccountsStoreUpdater }))

function Updaters() {
  const location = useLocation()

  const ListsUpdater = useDeferredComponent(loadListsUpdater)
  const SystemThemeUpdater = useDeferredComponent(loadSystemThemeUpdater)
  const ThemeColorMetaUpdater = useDeferredComponent(loadThemeColorMetaUpdater)
  const ApplicationUpdater = useDeferredComponent(loadApplicationUpdater)
  const ActivityStateUpdater = useDeferredComponent(loadActivityStateUpdater)
  const LogsUpdater = useDeferredComponent(loadLogsUpdater)
  const FiatOnRampTransactionsUpdater = useDeferredComponent(loadFiatOnRampTransactionsUpdater)
  const WebAccountsStoreUpdater = useDeferredComponent(loadWebAccountsStoreUpdater)

  return (
    <>
      <Helmet>
        <link rel="canonical" href={getCanonicalUrl(location.pathname)} />
      </Helmet>
      {ListsUpdater && <ListsUpdater />}
      {SystemThemeUpdater && <SystemThemeUpdater />}
      {ThemeColorMetaUpdater && <ThemeColorMetaUpdater />}
      {ApplicationUpdater && <ApplicationUpdater />}
      {ActivityStateUpdater && <ActivityStateUpdater />}
      {LogsUpdater && <LogsUpdater />}
      {FiatOnRampTransactionsUpdater && <FiatOnRampTransactionsUpdater />}
      {WebAccountsStoreUpdater && <WebAccountsStoreUpdater />}
      <AccountsStoreDevTool />
    </>
  )
}

// Production Web3Provider – always reconnects on mount and runs capability effects.
const Web3Provider = createWeb3Provider({ wagmiConfig })

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!isDevEnv() || localDevDatadogEnabled) {
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
          <QueryClientPersistProvider>
            <NuqsAdapter>
              <Router>
                <I18nextProvider i18n={i18n}>
                  <LanguageProvider>
                    <Web3Provider>
                      <StatsigProvider>
                        <ExternalWalletProvider>
                          <ConnectWalletMutationProvider>
                            <WebAccountsStoreProvider>
                              <WebUniswapProvider>
                                <GraphqlProviders>
                                  <LocalizationContextProvider>
                                    <BlockNumberProvider>
                                      <Updaters />
                                      <ThemeProvider>
                                        <TamaguiProvider>
                                          <PortalProvider>
                                            <ThemedGlobalStyle />
                                            <App />
                                          </PortalProvider>
                                        </TamaguiProvider>
                                      </ThemeProvider>
                                    </BlockNumberProvider>
                                  </LocalizationContextProvider>
                                </GraphqlProviders>
                              </WebUniswapProvider>
                            </WebAccountsStoreProvider>
                          </ConnectWalletMutationProvider>
                        </ExternalWalletProvider>
                      </StatsigProvider>
                    </Web3Provider>
                  </LanguageProvider>
                </I18nextProvider>
              </Router>
            </NuqsAdapter>
          </QueryClientPersistProvider>
        </Provider>
      </ReactRouterUrlProvider>
    </HelmetProvider>
  </StrictMode>,
)

// We once had a ServiceWorker, and users who have not visited since then may still have it registered.
// This ensures it is truly gone.
unregisterServiceWorker()
