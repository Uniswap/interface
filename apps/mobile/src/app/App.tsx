import { ApolloProvider } from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance'
import {
  DatadogSessionSampleRateKey,
  DynamicConfigs,
  Experiments,
  getDynamicConfigValue,
  getStatsigClient,
  StatsigCustomAppValue,
  StatsigUser,
  Storage,
  WALLET_FEATURE_FLAG_NAMES,
} from '@universe/gating'
import { MMKVWrapper } from 'apollo3-cache-persist'
import { default as React, StrictMode, useCallback, useEffect, useMemo, useRef } from 'react'
import { I18nextProvider } from 'react-i18next'
import { LogBox, NativeModules, StatusBar } from 'react-native'
import appsFlyer from 'react-native-appsflyer'
import DeviceInfo, { getUniqueIdSync } from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { MMKV } from 'react-native-mmkv'
import { OneSignal } from 'react-native-onesignal'
import { configureReanimatedLogger } from 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableFreeze } from 'react-native-screens'
import { useDispatch, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { MobileWalletNavigationProvider } from 'src/app/MobileWalletNavigationProvider'
import { AppModals } from 'src/app/modals/AppModals'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { store } from 'src/app/store'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { useLogMissingMnemonic } from 'src/features/analytics/useLogMissingMnemonic'
import {
  DatadogProviderWrapper,
  MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE,
} from 'src/features/datadog/DatadogProviderWrapper'
import { setDatadogUserWithUniqueId } from 'src/features/datadog/user'
import { OneSignalUserTagField } from 'src/features/notifications/constants'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { statsigMMKVStorageProvider } from 'src/features/statsig/statsigMMKVStorageProvider'
import { shouldLogScreen } from 'src/features/telemetry/directLogScreens'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import {
  processWidgetEvents,
  setAccountAddressesUserDefaults,
  setFavoritesUserDefaults,
  setI18NUserDefaults,
} from 'src/features/widgets/widgets'
import { initDynamicIntlPolyfills } from 'src/polyfills/intl-delayed'
import { useDatadogUserAttributesTracking } from 'src/screens/HomeScreen/useDatadogUserAttributesTracking'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { flexStyles, useIsDarkMode } from 'ui/src'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { config } from 'uniswap/src/config'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { initializePortfolioQueryOverrides } from 'uniswap/src/data/rest/portfolioBalanceOverrides'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { clearNotificationQueue } from 'uniswap/src/features/notifications/slice/slice'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { CurrencyId } from 'uniswap/src/types/currency'
import { datadogEnabledBuild } from 'utilities/src/environment/constants'
import { isTestEnv } from 'utilities/src/environment/env'
import { registerConsoleOverrides } from 'utilities/src/logger/console'
import { attachUnhandledRejectionHandler, setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { DDRumAction, DDRumTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { logger } from 'utilities/src/logger/logger'
import { isIOS } from 'utilities/src/platform'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
// biome-ignore lint/style/noRestrictedImports: Required for Apollo client initialization at app root
import { usePersistedApolloClient } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { AccountsStoreContextProvider } from 'wallet/src/features/accounts/store/provider'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { useHeartbeatReporter } from 'wallet/src/features/telemetry/hooks/useHeartbeatReporter'
import { useLastBalancesReporter } from 'wallet/src/features/telemetry/hooks/useLastBalancesReporter'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks/useTestnetModeForLoggingAndAnalytics'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
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

// Log boxes on simulators can block e2e tap event when they cover buttons placed at
// the bottom of the screen and cause tests to fail.
if (config.isE2ETest) {
  LogBox.ignoreAllLogs()
}

initDynamicIntlPolyfills()

initOneSignal()
initAppsFlyer()

initializePortfolioQueryOverrides({ store })

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
  )
}

const MAX_CACHE_SIZE_IN_BYTES = 1024 * 1024 * 25 // 25 MB

// Ensures redux state is available inside usePersistedApolloClient for the custom endpoint
function AppOuter(): JSX.Element | null {
  const customEndpoint = useSelector(selectCustomEndpoint)
  const client = usePersistedApolloClient({
    storageWrapper: new MMKVWrapper(new MMKV()),
    maxCacheSizeInBytes: MAX_CACHE_SIZE_IN_BYTES,
    customEndpoint,
    reduxStore: store,
  })
  const jsBundleLoadedRef = useRef(false)

  /**
   * Function called by the @shopify/react-native-performance PerformanceProfiler that returns a
   * RenderPassReport. We then forward this report to Datadog, Amplitude, etc.
   */
  const onReportPrepared = useCallback(async (report: RenderPassReport) => {
    if (datadogEnabledBuild) {
      const shouldLogJsBundleLoaded = report.timeToBootJsMillis && !jsBundleLoadedRef.current
      if (shouldLogJsBundleLoaded) {
        await DdRum.addAction(RumActionType.CUSTOM, DDRumAction.ApplicationStartJs, {
          loading_time: report.timeToBootJsMillis,
        })
        jsBundleLoadedRef.current = true
        // Note that we are not checking report.interactive here because it's not consistently reported.
        // Additionally, we are not tracking interactive the same way @shopify/react-native-performance does.
        await DdRum.addTiming(DDRumTiming.ScreenInteractive)
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
        <ErrorBoundary>
          <BlankUrlProvider>
            <LocalizationContextProvider>
              <GestureHandlerRootView style={flexStyles.fill}>
                <WalletContextProvider>
                  <NavigationContainer>
                    <MobileWalletNavigationProvider>
                      <NativeWalletProvider>
                        <AccountsStoreContextProvider>
                          <WalletUniswapProvider>
                            <DataUpdaters />
                            <BottomSheetModalProvider>
                              <AppModals />
                              <PerformanceProfiler onReportPrepared={onReportPrepared}>
                                <AppInner />
                              </PerformanceProfiler>
                            </BottomSheetModalProvider>
                            <NotificationToastWrapper />
                          </WalletUniswapProvider>
                        </AccountsStoreContextProvider>
                      </NativeWalletProvider>
                    </MobileWalletNavigationProvider>
                  </NavigationContainer>
                </WalletContextProvider>
              </GestureHandlerRootView>
            </LocalizationContextProvider>
          </BlankUrlProvider>
        </ErrorBoundary>
      </PersistGate>
    </ApolloProvider>
  )
}

function AppInner(): JSX.Element {
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const themeSetting = useCurrentAppearanceSetting()
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
    // TODO: This is a temporary solution (it should be replaced with Appearance.setColorScheme
    // after updating RN to 0.72.0 or higher)
    NativeModules.ThemeModule.setColorScheme(themeSetting)
  }, [themeSetting])

  useLogMissingMnemonic()

  return (
    <>
      <OfflineBanner />
      <TestnetModeBanner />
      <AppStackNavigator />
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </>
  )
}

/**
 * Background side effects that run in the background and are not part of the main app.
 * A separate component is used to avoid unnecessary re-rendering of the main app when
 * these services are running.
 */
function DataUpdaters(): JSX.Element {
  const favoriteTokens: CurrencyId[] = useSelector(selectFavoriteTokens)
  const accountsMap: Record<string, Account> = useAccounts()
  const { locale } = useCurrentLanguageInfo()
  const { code } = useAppFiatCurrencyInfo()
  const finishedOnboarding = useSelector(selectFinishedOnboarding)

  useDatadogUserAttributesTracking({ isOnboarded: !!finishedOnboarding })
  useHeartbeatReporter({ isOnboarded: !!finishedOnboarding })
  useLastBalancesReporter({ isOnboarded: !!finishedOnboarding })
  useTestnetModeForLoggingAndAnalytics()

  // Refreshes widgets when bringing app to foreground
  useAppStateTrigger({ from: 'background', to: 'active', callback: processWidgetEvents })

  useEffect(() => {
    setFavoritesUserDefaults(favoriteTokens)
  }, [favoriteTokens])

  useEffect(() => {
    setAccountAddressesUserDefaults(Object.values(accountsMap))
  }, [accountsMap])

  useEffect(() => {
    setI18NUserDefaults({ locale, currency: code })
  }, [code, locale])

  return (
    <>
      <TraceUserProperties />
      <TransactionHistoryUpdater />
    </>
  )
}

export default App
