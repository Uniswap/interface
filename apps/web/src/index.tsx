// Ordering is intentional and must be preserved: sideEffects followed by functionality.
import '~/sideEffects'
import { getDeviceId } from '@amplitude/analytics-browser'
import { ApolloProvider } from '@apollo/client'
import { datadogRum } from '@datadog/browser-rum'
import { PrivyProvider } from '@privy-io/react-auth'
import { ApiInit, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import { ComplianceClientProvider } from '@universe/compliance'
import { isDevEnv, isTestEnv, localDevDatadogEnabled } from '@universe/environment'
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
import type { PropsWithChildren, ReactNode } from 'react'
import { lazy, StrictMode, Suspense, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Helmet, HelmetProvider } from 'react-helmet-async/lib/index'
import { I18nextProvider } from 'react-i18next'
import { configureReanimatedLogger } from 'react-native-reanimated'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, useLocation } from 'react-router'
import { PortalProvider } from 'ui/src'
import { ReactRouterUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { initializePortfolioQueryOverrides } from 'uniswap/src/data/rest/portfolioBalanceOverrides'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import i18n from 'uniswap/src/i18n'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { getLogger } from 'utilities/src/logger/logger'
// oxlint-disable-next-line no-restricted-imports -- custom useAccount hook requires statsig
import { useAccount } from 'wagmi'
import { App } from '~/App'
import { WebUniswapProvider } from '~/app/WebUniswapContext'
import { apolloClient } from '~/appGraphql/data/apollo/client'
import { TransactionWatcherProvider } from '~/appGraphql/data/apollo/TransactionWatcherProvider'
import { QueryClientPersistProvider } from '~/components/PersistQueryClient'
import { createWeb3Provider, WalletCapabilitiesEffects } from '~/components/Web3Provider/createWeb3Provider'
import { getConfig, getPrivyConfig } from '~/config'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { AccountsStoreDevTool } from '~/features/accounts/store/devtools'
import { WebAccountsStoreProvider } from '~/features/accounts/store/provider'
import { ConnectWalletMutationProvider } from '~/features/wallet/connection/hooks/useConnectWalletMutation'
import { ExternalWalletProvider } from '~/features/wallet/providers/ExternalWalletProvider'
import { useDeferredComponent } from '~/hooks/useDeferredComponent'
import { isPrivyConfigured } from '~/hooks/useMaybePrivy'
import { LanguageProvider } from '~/i18n/LanguageProvider'
import { BlockNumberProvider } from '~/lib/hooks/useBlockNumber'
import { WebNotificationServiceManager } from '~/notification-service/WebNotificationService'
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
const loadActivityStateUpdater = () => import('~/state/activity/updater')
const loadLogsUpdater = () => import('~/state/logs/updater')
const loadFiatOnRampTransactionsUpdater = () => import('~/state/fiatOnRampTransactions/updater')
const loadWebAccountsStoreUpdater = () => import('~/features/accounts/store/updater')

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
      createTurnstileSolver({
        performanceTracker,
        getLogger,
        onSolveCompleted: onTurnstileSolveCompleted,
      }),
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
        getLogger,
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
        <link rel="canonical" href={getCanonicalUrl(location.pathname, location.search)} />
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
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}

function StatsigProvider({ children }: PropsWithChildren) {
  const account = useAccount()

  const statsigUser: StatsigUser = useMemo(
    () => ({
      userID: getDeviceId(),
      customIDs: { address: account.address ?? '' },
      custom: {
        appVersion: getConfig().appVersion || 'unknown',
      },
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
    // oxlint-disable-next-line typescript/no-unnecessary-condition
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

function MaybePrivyProvider({ children }: { children: ReactNode }) {
  if (!isPrivyConfigured()) {
    return <>{children}</>
  }
  const { appId, clientId } = getPrivyConfig(false)
  return (
    <PrivyProvider appId={appId} clientId={clientId} config={{ loginMethods: ['email', 'google', 'apple'] }}>
      {children}
    </PrivyProvider>
  )
}

// Gated by `__DEV__` (Vite build-time constant) so Rollup DCE's the `import('agentation')`
// call in production builds and no chunk is emitted.
const AgentationLazy = __DEV__ ? lazy(() => import('agentation').then((m) => ({ default: m.Agentation }))) : null

const container = document.getElementById('root') as HTMLElement

const Router = isBrowserRouterEnabled() ? BrowserRouter : HashRouter

const RootApp = (): JSX.Element => {
  return (
    <StrictMode>
      <HelmetProvider>
        <ReactRouterUrlProvider>
          <Provider store={store}>
            <QueryClientPersistProvider>
              <ComplianceClientProvider>
                <NuqsAdapter>
                  <Router>
                    <MaybePrivyProvider>
                      <I18nextProvider i18n={i18n}>
                        <LanguageProvider>
                          <Web3Provider>
                            <StatsigProvider>
                              <WalletCapabilitiesEffects />
                              <ExternalWalletProvider>
                                <ConnectWalletMutationProvider>
                                  <WebAccountsStoreProvider>
                                    <WebUniswapProvider>
                                      <GraphqlProviders>
                                        <TransactionWatcherProvider>
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
                                                      {AgentationLazy && isDevEnv() && (
                                                        <Suspense fallback={null}>
                                                          <AgentationLazy />
                                                        </Suspense>
                                                      )}
                                                    </PortalProvider>
                                                  </TamaguiProvider>
                                                </ThemeProvider>
                                              </BlockNumberProvider>
                                            </LocalizationContextProvider>
                                          </LivePricesProvider>
                                        </TransactionWatcherProvider>
                                      </GraphqlProviders>
                                    </WebUniswapProvider>
                                  </WebAccountsStoreProvider>
                                </ConnectWalletMutationProvider>
                              </ExternalWalletProvider>
                            </StatsigProvider>
                          </Web3Provider>
                        </LanguageProvider>
                      </I18nextProvider>
                    </MaybePrivyProvider>
                  </Router>
                </NuqsAdapter>
              </ComplianceClientProvider>
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
