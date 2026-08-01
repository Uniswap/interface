import 'src/global.css'
import { ApolloProvider } from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PerformanceProfiler, type RenderPassReport } from '@shopify/react-native-performance'
import { ApiInit, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import { isIOS, isTestEnv, isDatadogEnabled, isE2eTestEnv } from '@universe/environment'
import {
  DatadogSessionSampleRateKey,
  DynamicConfigs,
  Experiments,
  getDynamicConfigValue,
  getIsHashcashSolverEnabled,
  getIsSessionServiceEnabled,
  getIsSessionsPerformanceTrackingEnabled,
  getIsSessionUpgradeAutoEnabled,
  getIsTurnstileSolverEnabled,
  getStatsigClient,
  StatsigCustomAppValue,
  type StatsigUser,
  Storage,
  useIsSessionServiceEnabled,
  WALLET_FEATURE_FLAG_NAMES,
} from '@universe/gating'
import {
  type ChallengeSolver,
  ChallengeType,
  createChallengeSolverService,
  createHashcashMockSolver,
  createHashcashSolver,
  createPerformanceTracker,
  createSessionInitializationService,
  createTurnstileMockSolver,
  type SessionInitializationService,
} from '@universe/sessions'
import { MMKVWrapper } from 'apollo3-cache-persist'
import { default as React, StrictMode, useCallback, useEffect, useMemo, useRef } from 'react'
import { I18nextProvider } from 'react-i18next'
import { NativeModules, StatusBar } from 'react-native'
import appsFlyer from 'react-native-appsflyer'
import DeviceInfo, { getUniqueIdSync } from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { OneSignal } from 'react-native-onesignal'
import { configureReanimatedLogger } from 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableFreeze } from 'react-native-screens'
import { useDispatch, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ignoreFabricMountStateErrors } from 'src/app/ignoreFabricMountStateErrors'
import { createMMKVApolloAdapter } from 'src/app/mmkvApolloAdapter'
import { MobileWalletNavigationProvider } from 'src/app/MobileWalletNavigationProvider'
import { AppModals } from 'src/app/modals/AppModals'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { store } from 'src/app/store'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { useLogMissingMnemonic } from 'src/features/analytics/useLogMissingMnemonic'
import { useLogUnexpectedOnboardingReset } from 'src/features/analytics/useLogUnexpectedOnboardingReset'
import { useAppStateResetter } from 'src/features/appState/appStateResetter'
import {
  DatadogProviderWrapper,
  MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE,
} from 'src/features/datadog/DatadogProviderWrapper'
import { useDatadogWalletContext } from 'src/features/datadog/useDatadogWalletContext'
import { setDatadogUserWithUniqueId } from 'src/features/datadog/user'
import { setupExpoImageMemoryWatcher } from 'src/features/images/expoImageCacheSetup'
import { OneSignalUserTagField } from 'src/features/notifications/constants'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { PrivyProviderWrapper } from 'src/features/passkey/PrivyProviderWrapper'
import { createHashcashWorkerChannel } from 'src/features/sessions/createHashcashWorkerChannel'
import { statsigMMKVStorageProvider } from 'src/features/statsig/statsigMMKVStorageProvider'
import { shouldLogScreen } from 'src/features/telemetry/directLogScreens'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { useSyncWidgetUserDefaults } from 'src/features/widgets/useSyncWidgetUserDefaults'
import { SystemBannerPortalProvider } from 'src/notification-service/notification-renderer/SystemBannerPortal'
import { initDynamicIntlPolyfills, loadIntlPolyfillsForLocale } from 'src/polyfills/intl-delayed'
import { useDatadogUserAttributesTracking } from 'src/screens/HomeScreen/useDatadogUserAttributesTracking'
import { flexStyles, useIsDarkMode } from 'ui/src'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { initializePortfolioQueryOverrides } from 'uniswap/src/data/rest/portfolioBalanceOverrides'
import { useCurrentAppearanceSetting, useSelectedColorScheme } from 'uniswap/src/features/appearance/hooks'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { mapLanguageToLocale } from 'uniswap/src/features/language/constants'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { clearNotificationQueue } from 'uniswap/src/features/notifications/slice/slice'
import { RemotePriceProvider } from 'uniswap/src/features/prices/RemotePriceProvider'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n, { changeLanguage } from 'uniswap/src/i18n'
import { Uniwind } from 'uniwind'
import { registerConsoleOverrides } from 'utilities/src/logger/console'
import { attachUnhandledRejectionHandler, setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { DDRumAction, DDRumTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { reportAppStartTiming } from 'utilities/src/logger/datadog/reportAppStartTiming'
import { getLogger, logger } from 'utilities/src/logger/logger'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
// oxlint-disable-next-line no-restricted-imports -- Required for Apollo client initialization at app root
import { usePersistedApolloClient } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { AccountsStoreContextProvider } from 'wallet/src/features/accounts/store/provider'
import { StatsigUserIdentifiersUpdater } from 'wallet/src/features/gating/StatsigUserIdentifiersUpdater'
import { useHeartbeatReporter } from 'wallet/src/features/telemetry/hooks/useHeartbeatReporter'
import { useLastBalancesReporter } from 'wallet/src/features/telemetry/hooks/useLastBalancesReporter'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks/useTestnetModeForLoggingAndAnalytics'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { NativeWalletProvider } from 'wallet/src/features/wallet/providers/NativeWalletProvider'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'
import { SharedWalletProvider as SharedWalletReduxProvider } from 'wallet/src/providers/SharedWalletProvider'
import { getReduxPersistor } from 'wallet/src/state/persistor'

enableFreeze(true)

if (__DEV__ && !isTestEnv()) {
  registerConsoleOverrides()
  // TODO(WALL-5780): Fix "Reading from `value` during component render." warnings while
  // mainly switching between screens.
  configureReanimatedLogger({
    strict: false,
  })
  loadDevMessages()
  loadErrorMessages()
}

initDynamicIntlPolyfills()

initOneSignal()
initAppsFlyer()

initializePortfolioQueryOverrides({ store })

setupExpoImageMemoryWatcher()

/**
 * Wrapper component that provides the app state resetter to ErrorBoundary.
 * Necessary to access the redux and query providers
 */
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const appStateResetter = useAppStateResetter()
  return <ErrorBoundary appStateResetter={appStateResetter}>{children}</ErrorBoundary>
}

const provideSessionInitializationService = (): SessionInitializationService => {
  // Create performance tracker with feature flag control
  // Platform-specific: uses React Native's performance.now() API
  const performanceTracker = createPerformanceTracker({
    getIsPerformanceTrackingEnabled: getIsSessionsPerformanceTrackingEnabled,
    getNow: () => performance.now(),
  })

  // Build solvers map based on feature flags
  const solvers = new Map<ChallengeType, ChallengeSolver>()

  if (getIsTurnstileSolverEnabled()) {
    // Turnstile not supported on mobile - use mock
    solvers.set(ChallengeType.TURNSTILE, createTurnstileMockSolver())
  } else {
    solvers.set(ChallengeType.TURNSTILE, createTurnstileMockSolver())
  }
  if (getIsHashcashSolverEnabled()) {
    // Use real hashcash solver with native Nitro module
    // The native implementation runs on background threads via platform-native APIs
    solvers.set(
      ChallengeType.HASHCASH,
      createHashcashSolver({
        performanceTracker,
        getWorkerChannel: () => createHashcashWorkerChannel(),
        getLogger,
      }),
    )
  } else {
    solvers.set(ChallengeType.HASHCASH, createHashcashMockSolver())
  }

  return createSessionInitializationService({
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
    performanceTracker,
    getIsSessionUpgradeAutoEnabled,
    getLogger,
  })
}

function App(): JSX.Element | null {
  useEffect(() => {
    if (!__DEV__) {
      attachUnhandledRejectionHandler()
      setAttributesToDatadog({ buildNumber: DeviceInfo.getBuildNumber() }).catch(() => undefined)
    }

    setDatadogUserWithUniqueId(undefined)
  }, [])

  const [datadogSessionSampleRate, setDatadogSessionSampleRate] = React.useState<number | undefined>(undefined)

  Storage._setProvider(statsigMMKVStorageProvider)

  const statsigUser: StatsigUser = useMemo(
    () => ({
      userID: getUniqueIdSync(),
      custom: {
        app: StatsigCustomAppValue.Mobile,
      },
    }),
    [],
  )

  const onStatsigInit = (): void => {
    setDatadogSessionSampleRate(
      getDynamicConfigValue({
        config: DynamicConfigs.DatadogSessionSampleRate,
        key: DatadogSessionSampleRateKey.Rate,
        defaultValue: MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE,
      }),
    )
  }

  return (
    // Must wrap TamaguiProvider (inside SharedWalletReduxProvider): its root PortalHost needs the
    // gesture root's context or portaled content (Popover, ActionSheetDropdown) throws under RNGH 3.
    <GestureHandlerRootView style={flexStyles.fill}>
      <StatsigProviderWrapper user={statsigUser} storageProvider={statsigMMKVStorageProvider} onInit={onStatsigInit}>
        <DatadogProviderWrapper sessionSampleRate={datadogSessionSampleRate}>
          <Trace>
            <StrictMode>
              <I18nextProvider i18n={i18n}>
                <SafeAreaProvider>
                  <KeyboardProvider navigationBarTranslucent>
                    <SharedWalletReduxProvider reduxStore={store}>
                      <AnalyticsNavigationContextProvider
                        shouldLogScreen={shouldLogScreen}
                        useIsPartOfNavigationTree={useIsPartOfNavigationTree}
                      >
                        <AppOuter />
                      </AnalyticsNavigationContextProvider>
                    </SharedWalletReduxProvider>
                  </KeyboardProvider>
                </SafeAreaProvider>
              </I18nextProvider>
            </StrictMode>
          </Trace>
        </DatadogProviderWrapper>
      </StatsigProviderWrapper>
    </GestureHandlerRootView>
  )
}

const MAX_CACHE_SIZE_IN_BYTES = 1024 * 1024 * 25 // 25 MB

/**
 * Applies the persisted language from Redux to i18n on app launch.
 * Renders inside PersistGate so Redux is already rehydrated when this mounts.
 */
function ApplyPersistedLanguage(): null {
  const currentLanguage = useSelector(selectCurrentLanguage)

  useEffect(() => {
    const locale = mapLanguageToLocale[currentLanguage]
    // Ensure the Intl locale data for the persisted language is loaded (it may differ
    // from the device locale loaded at startup) so number formatting is localized correctly.
    loadIntlPolyfillsForLocale(locale)
    changeLanguage(locale).catch(() => undefined)
  }, [currentLanguage])

  return null
}

// Ensures redux state is available inside usePersistedApolloClient for the custom endpoint
function AppOuter(): JSX.Element | null {
  const customEndpoint = useSelector(selectCustomEndpoint)
  const client = usePersistedApolloClient({
    storageWrapper: new MMKVWrapper(createMMKVApolloAdapter()),
    maxCacheSizeInBytes: MAX_CACHE_SIZE_IN_BYTES,
    customEndpoint,
  })
  const jsBundleLoadedRef = useRef(false)

  /**
   * Function called by the @shopify/react-native-performance PerformanceProfiler that returns a
   * RenderPassReport. We then forward this report to Datadog, Amplitude, etc.
   */
  const onReportPrepared = useCallback(async (report: RenderPassReport) => {
    if (isDatadogEnabled() || isE2eTestEnv()) {
      const shouldLogJsBundleLoaded = report.timeToBootJsMillis && !jsBundleLoadedRef.current
      if (shouldLogJsBundleLoaded) {
        await DdRum.addAction(RumActionType.CUSTOM, DDRumAction.ApplicationStartJs, {
          loading_time: report.timeToBootJsMillis,
        })
        jsBundleLoadedRef.current = true
        // Note that we are not checking report.interactive here because it's not consistently reported.
        // Additionally, we are not tracking interactive the same way @shopify/react-native-performance does.
        await DdRum.addTiming(DDRumTiming.ScreenInteractive)
        // Durable cold-start TTI signal we own (SDK v3 dropped auto application_start); fire-and-forget so a RUM rejection can't drop the Amplitude report below.
        reportAppStartTiming({
          ttiMillis: report.timeToBootJsMillis + (report.timeToRenderMillis ?? 0),
          jsBootTimeMillis: report.timeToBootJsMillis,
        }).catch(() => undefined)
      }
    }
    sendAnalyticsEvent(MobileEventName.PerformanceReport, report)
  }, [])

  useEffect(() => {
    for (const [_, flagKey] of WALLET_FEATURE_FLAG_NAMES.entries()) {
      DdRum.addFeatureFlagEvaluation(
        // Datadog has a limited set of accepted symbols in feature flags
        // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
        flagKey.replaceAll('-', '_'),
        getStatsigClient().checkGate(flagKey),
      ).catch(() => undefined)
    }

    for (const experiment of Object.values(Experiments)) {
      DdRum.addFeatureFlagEvaluation(
        // Datadog has a limited set of accepted symbols in feature flags
        // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
        `experiment_${experiment.replaceAll('-', '_')}`,
        getStatsigClient().getExperiment(experiment).groupName,
      ).catch(() => undefined)
    }

    if (isIOS) {
      OneSignal.User.addTags({
        [OneSignalUserTagField.GatingUnfundedWalletsEnabled]: 'true',
      })
    }
  }, [])

  if (!client) {
    return null
  }

  return (
    <ApolloProvider client={client}>
      <PersistGate loading={null} persistor={getReduxPersistor()}>
        <ErrorBoundaryWrapper>
          <ApplyPersistedLanguage />
          <BlankUrlProvider>
            <LocalizationContextProvider>
              <WalletContextProvider>
                <PrivyProviderWrapper>
                  <NavigationContainer>
                    <MobileWalletNavigationProvider>
                      <NativeWalletProvider>
                        <RemotePriceProvider>
                          <WalletUniswapProvider>
                            <AccountsStoreContextProvider>
                              <DataUpdaters />
                              <BottomSheetModalProvider>
                                <AppModals />
                                <PerformanceProfiler
                                  errorHandler={ignoreFabricMountStateErrors}
                                  onReportPrepared={onReportPrepared}
                                >
                                  <AppInner />
                                </PerformanceProfiler>
                              </BottomSheetModalProvider>
                              <NotificationToastWrapper />
                            </AccountsStoreContextProvider>
                          </WalletUniswapProvider>
                        </RemotePriceProvider>
                      </NativeWalletProvider>
                    </MobileWalletNavigationProvider>
                  </NavigationContainer>
                </PrivyProviderWrapper>
              </WalletContextProvider>
            </LocalizationContextProvider>
          </BlankUrlProvider>
        </ErrorBoundaryWrapper>
      </PersistGate>
    </ApolloProvider>
  )
}

function AppInner(): JSX.Element {
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const themeSetting = useCurrentAppearanceSetting()
  const selectedColorScheme = useSelectedColorScheme()
  const allowAnalytics = useSelector(selectAllowAnalytics)

  // handles AppsFlyer enable/disable based on the allow analytics toggle
  useEffect(() => {
    if (allowAnalytics) {
      appsFlyer.startSdk()
      logger.debug('AppsFlyer', 'status', 'started')
    } else {
      appsFlyer.stop(!allowAnalytics, (res: unknown) => {
        if (typeof res === 'string' && res === 'Success') {
          logger.debug('AppsFlyer', 'status', 'stopped')
        } else {
          logger.warn('AppsFlyer', 'stop', `Got an error when trying to stop the AppsFlyer SDK: ${res}`)
        }
      })
    }
  }, [allowAnalytics])

  useEffect(() => {
    dispatch(clearNotificationQueue()) // clear all in-app toasts on app start
  }, [dispatch])

  useEffect(() => {
    // Re-fire on resolved scheme too: when the setting is "system", an OS theme flip
    // changes selectedColorScheme but not themeSetting, and the native side must re-sync.
    NativeModules['ThemeModule'].setColorScheme(themeSetting)
  }, [themeSetting, selectedColorScheme])

  useEffect(() => {
    // Sync uniwind's theme (Tailwind tokens from @universe/tailwind/native) with the resolved color scheme; no DOM, so switched imperatively.
    Uniwind.setTheme(selectedColorScheme)
  }, [selectedColorScheme])

  useLogMissingMnemonic()
  useLogUnexpectedOnboardingReset()

  return (
    <SystemBannerPortalProvider>
      <TestnetModeBanner />
      <AppStackNavigator />
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </SystemBannerPortalProvider>
  )
}

/**
 * Background side effects that run in the background and are not part of the main app.
 * A separate component is used to avoid unnecessary re-rendering of the main app when
 * these services are running.
 */
function DataUpdaters(): JSX.Element {
  const finishedOnboarding = useSelector(selectFinishedOnboarding)
  const isSessionServiceEnabled = useIsSessionServiceEnabled()

  useDatadogUserAttributesTracking({ isOnboarded: !!finishedOnboarding })
  useDatadogWalletContext()
  useHeartbeatReporter({ isOnboarded: !!finishedOnboarding })
  useLastBalancesReporter({ isOnboarded: !!finishedOnboarding })
  useTestnetModeForLoggingAndAnalytics()
  useSyncWidgetUserDefaults()

  return (
    <>
      <TraceUserProperties />
      <StatsigUserIdentifiersUpdater />
      <ApiInit
        getSessionInitService={provideSessionInitializationService}
        isSessionServiceEnabled={isSessionServiceEnabled}
      />
      <TransactionHistoryUpdater />
    </>
  )
}

export default App
