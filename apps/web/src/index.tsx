// Ordering is intentional and must be preserved: sideEffects followed by functionality.
import '~/sideEffects'

import { getDeviceId } from '@amplitude/analytics-browser'
import { ApolloProvider } from '@apollo/client'
import { datadogRum } from '@datadog/browser-rum'
import { ApiInit, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import type { StatsigUser } from '@universe/gating'
import {
  getIsHashcashSolverEnabled,
  getIsSessionServiceEnabled,
  getIsSessionsPerformanceTrackingEnabled,
  getIsSessionUpgradeAutoEnabled,
  getIsTurnstileSolverEnabled,
  useIsSessionServiceEnabled,
} from '@universe/gating'
import {
  type ChallengeSolver,
  ChallengeType,
  createChallengeSolverService,
  createHashcashMockSolver,
  createHashcashSolver,
  createHashcashWorkerChannel,
  createPerformanceTracker,
  createSessionInitializationService,
  createTurnstileMockSolver,
  createTurnstileSolver,
} from '@universe/sessions'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import type { PropsWithChildren } from 'react'
import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async/lib/index'
import { I18nextProvider } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports -- configures Reanimated logger to suppress dev warnings while shared packages still use Reanimated
import { configureReanimatedLogger } from 'react-native-reanimated'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, useLocation } from 'react-router'
import { PortalProvider } from 'ui/src'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { initializePortfolioQueryOverrides } from 'uniswap/src/data/rest/portfolioBalanceOverrides'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { TokenPriceProvider } from 'uniswap/src/features/prices/TokenPriceContext'
import i18n from 'uniswap/src/i18n'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { localDevDatadogEnabled } from 'utilities/src/environment/constants'
import { isDevEnv, isTestEnv } from 'utilities/src/environment/env'
import { getLogger } from 'utilities/src/logger/logger'
// biome-ignore lint/style/noRestrictedImports: custom useAccount hook requires statsig
import { useAccount } from 'wagmi'
import { AssetActivityProvider } from '~/appGraphql/data/apollo/AssetActivityProvider'
import { apolloClient } from '~/appGraphql/data/apollo/client'
import { TokenBalancesProvider } from '~/appGraphql/data/apollo/TokenBalancesProvider'
import { QueryClientPersistProvider } from '~/components/PersistQueryClient'
import { createWeb3Provider, WalletCapabilitiesEffects } from '~/components/Web3Provider/createWeb3Provider'
import { WebUniswapProvider } from '~/components/Web3Provider/WebUniswapContext'
import { wagmiConfig } from '~/components/Web3Provider/wagmiConfig'
import { AccountsStoreDevTool } from '~/features/accounts/store/devtools'
import { WebAccountsStoreProvider } from '~/features/accounts/store/provider'
import { ConnectWalletMutationProvider } from '~/features/wallet/connection/hooks/useConnectWalletMutation'
import { ExternalWalletProvider } from '~/features/wallet/providers/ExternalWalletProvider'
import { useDeferredComponent } from '~/hooks/useDeferredComponent'
import { LanguageProvider } from '~/i18n/LanguageProvider'
import { BlockNumberProvider } from '~/lib/hooks/useBlockNumber'
import { WebNotificationServiceManager } from '~/notification-service/WebNotificationService'
import App from '~/pages/App'
import { onHashcashSolveCompleted, onTurnstileSolveCompleted, sessionInitAnalytics } from '~/sessions/analytics'
import store from '~/state'
import { LivePricesProvider } from '~/state/livePrices/LivePricesProvider'
import { ThemedGlobalStyle, ThemeProvider } from '~/theme'
import { TamaguiProvider } from '~/theme/tamaguiProvider'
import { isBrowserRouterEnabled } from '~/utils/env'
import { unregister as unregisterServiceWorker } from '~/utils/serviceWorker'
import { getCanonicalUrl } from '~/utils/urlRoutes'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

if (__DEV__ && !isTestEnv()) {
  configureReanimatedLogger({
    strict: false,
  })
}

initializePortfolioQueryOverrides({ store })

const loadListsUpdater = () => import('~/state/lists/updater')
const loadApplicationUpdater = () => import('~/state/application/updater')
const loadActivityStateUpdater = () =>
  import('~/state/activity/updater').then((m) => ({ default: m.ActivityStateUpdater }))
const loadLogsUpdater = () => import('~/state/logs/updater')
const loadFiatOnRampTransactionsUpdater = () => import('~/state/fiatOnRampTransactions/updater')
const loadWebAccountsStoreUpdater = () =>
  import('~/features/accounts/store/updater').then((m) => ({ default: m.WebAccountsStoreUpdater }))

const provideSessionInitService = () => {
  // Create performance tracker with feature flag control
  // Platform-specific: uses web's performance.now() API
  const performanceTracker = createPerformanceTracker({
    getIsPerformanceTrackingEnabled: getIsSessionsPerformanceTrackingEnabled,
    getNow: () => performance.now(),
  })

  // Build solvers map based on feature flags
  const solvers = new Map<ChallengeType, ChallengeSolver>()

  if (getIsTurnstileSolverEnabled()) {
    solvers.set(
      ChallengeType.TURNSTILE,
      createTurnstileSolver({ performanceTracker, getLogger, onSolveCompleted: onTurnstileSolveCompleted }),
    )
  } else {
    solvers.set(ChallengeType.TURNSTILE, createTurnstileMockSolver())
  }
  if (getIsHashcashSolverEnabled()) {
    solvers.set(
      ChallengeType.HASHCASH,
      createHashcashSolver({
        performanceTracker,
        getWorkerChannel: () =>
          createHashcashWorkerChannel({
            getWorker: () => {
              return new Worker(
                new URL('@universe/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts', import.meta.url),
                { type: 'module' },
              )
            },
          }),
        onSolveCompleted: onHashcashSolveCompleted,
      }),
    )
  } else {
    solvers.set(ChallengeType.HASHCASH, createHashcashMockSolver())
  }

  return createSessionInitializationService({
    performanceTracker,
    getSessionService: () =>
      provideSessionService({
        getBaseUrl: getEntryGatewayUrl,
        getIsSessionServiceEnabled,
        getLogger,
      }),
    challengeSolverService: createChallengeSolverService({
      solvers,
      getLogger,
    }),
    getIsSessionUpgradeAutoEnabled,
    getLogger,
    analytics: sessionInitAnalytics,
  })
}

function Updaters() {
  const location = useLocation()
  const isSessionServiceEnabled = useIsSessionServiceEnabled()

  const ListsUpdater = useDeferredComponent(loadListsUpdater)
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
      {ApplicationUpdater && <ApplicationUpdater />}
      {ActivityStateUpdater && <ActivityStateUpdater />}
      {LogsUpdater && <LogsUpdater />}
      {FiatOnRampTransactionsUpdater && <FiatOnRampTransactionsUpdater />}
      {WebAccountsStoreUpdater && <WebAccountsStoreUpdater />}
      <AccountsStoreDevTool />
      <ApiInit getSessionInitService={provideSessionInitService} isSessionServiceEnabled={isSessionServiceEnabled} />
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

const RootApp = (): JSX.Element => {
  return (
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
                          <WalletCapabilitiesEffects />
                          <ExternalWalletProvider>
                            <ConnectWalletMutationProvider>
                              <WebAccountsStoreProvider>
                                <WebUniswapProvider>
                                  <TokenPriceProvider>
                                    <GraphqlProviders>
                                      <LivePricesProvider>
                                        <LocalizationContextProvider>
                                          <BlockNumberProvider>
                                            <Updaters />
                                            <ThemeProvider>
                                              <TamaguiProvider>
                                                <PortalProvider>
                                                  <WebNotificationServiceManager />
                                                  <ThemedGlobalStyle />
                                                  <App />
                                                </PortalProvider>
                                              </TamaguiProvider>
                                            </ThemeProvider>
                                          </BlockNumberProvider>
                                        </LocalizationContextProvider>
                                      </LivePricesProvider>
                                    </GraphqlProviders>
                                  </TokenPriceProvider>
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
    </StrictMode>
  )
}

createRoot(container).render(<RootApp />)

// We once had a ServiceWorker, and users who have not visited since then may still have it registered.
// This ensures it is truly gone.
unregisterServiceWorker()
