import { ApolloProvider } from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance'
import { MMKVWrapper } from 'apollo3-cache-persist'
import { default as React, StrictMode, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { I18nextProvider } from 'react-i18next'
import { LogBox, NativeModules, StatusBar } from 'react-native'
import appsFlyer from 'react-native-appsflyer'
import DeviceInfo from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { MMKV } from 'react-native-mmkv'
import { OneSignal } from 'react-native-onesignal'
import { configureReanimatedLogger } from 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableFreeze } from 'react-native-screens'
import { useDispatch, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { MobileWalletNavigationProvider } from 'src/app/MobileWalletNavigationProvider'
import { AppModals } from 'src/app/modals/AppModals'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { store } from 'src/app/store'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { useLogMissingMnemonic } from 'src/features/analytics/useLogMissingMnemonic'
import {
  DatadogProviderWrapper,
  MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE,
} from 'src/features/datadog/DatadogProviderWrapper'
import { setDatadogUserWithUniqueId } from 'src/features/datadog/user'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { OneSignalUserTagField } from 'src/features/notifications/constants'
import { statsigMMKVStorageProvider } from 'src/features/statsig/statsigMMKVStorageProvider'
import { shouldLogScreen } from 'src/features/telemetry/directLogScreens'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import {
  processWidgetEvents,
  setAccountAddressesUserDefaults,
  setFavoritesUserDefaults,
  setI18NUserDefaults,
} from 'src/features/widgets/widgets'
import { loadLocaleData } from 'src/polyfills/intl-delayed'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { flexStyles, useIsDarkMode } from 'ui/src'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { config } from 'uniswap/src/config'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import {
  DatadogSessionSampleRateKey,
  DatadogSessionSampleRateValType,
  DynamicConfigs,
} from 'uniswap/src/features/gating/configs'
import { StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, WALLET_FEATURE_FLAG_NAMES } from 'uniswap/src/features/gating/flags'
import { getDynamicConfigValue, getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { StatsigUser, Storage, getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { clearNotificationQueue } from 'uniswap/src/features/notifications/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import i18n from 'uniswap/src/i18n'
import { CurrencyId } from 'uniswap/src/types/currency'
import { datadogEnabledBuild } from 'utilities/src/environment/constants'
import { isTestEnv } from 'utilities/src/environment/env'
import { registerConsoleOverrides } from 'utilities/src/logger/console'
import { attachUnhandledRejectionHandler, setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { DDRumAction, DDRumTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { logger } from 'utilities/src/logger/logger'
import { isIOS } from 'utilities/src/platform'
import { useAsyncData } from 'utilities/src/react/hooks'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { getReduxPersistor } from 'wallet/src/state/persistor'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePersistedApolloClient } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks/useTestnetModeForLoggingAndAnalytics'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

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

initOneSignal()
initAppsFlyer()

function App(): JSX.Element | null {
  useEffect(() => {
    if (!__DEV__) {
      attachUnhandledRejectionHandler()
      setAttributesToDatadog({ buildNumber: DeviceInfo.getBuildNumber() }).catch(() => undefined)
    }
  }, [])

  // We want to ensure deviceID is used as the identifier to link with analytics
  const fetchAndSetDeviceId = useCallback(async (): Promise<string> => {
    return setDatadogUserWithUniqueId(undefined)
  }, [])

  const deviceId = useAsyncData(fetchAndSetDeviceId).data

  const [datadogSessionSampleRate, setDatadogSessionSampleRate] = React.useState<number | undefined>(undefined)

  Storage._setProvider(statsigMMKVStorageProvider)

  const statsigUser: StatsigUser = useMemo(
    () => ({
      ...(deviceId ? { userID: deviceId } : {}),
      custom: {
        app: StatsigCustomAppValue.Mobile,
      },
    }),
    [deviceId],
  )

  const onStatsigInit = (): void => {
    setDatadogSessionSampleRate(
      getDynamicConfigValue<
        DynamicConfigs.DatadogSessionSampleRate,
        DatadogSessionSampleRateKey,
        DatadogSessionSampleRateValType
      >(
        DynamicConfigs.DatadogSessionSampleRate,
        DatadogSessionSampleRateKey.Rate,
        MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE,
      ),
    )
  }

  return (
    <StatsigProviderWrapper user={statsigUser} storageProvider={statsigMMKVStorageProvider} onInit={onStatsigInit}>
      <DatadogProviderWrapper sessionSampleRate={datadogSessionSampleRate}>
        <Trace>
          <StrictMode>
            <I18nextProvider i18n={i18n}>
              <SafeAreaProvider>
                <SharedWalletProvider reduxStore={store}>
                  <AnalyticsNavigationContextProvider
                    shouldLogScreen={shouldLogScreen}
                    useIsPartOfNavigationTree={useIsPartOfNavigationTree}
                  >
                    <AppOuter />
                  </AnalyticsNavigationContextProvider>
                </SharedWalletProvider>
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

  const { locale } = useCurrentLanguageInfo()
  useLayoutEffect(() => {
    // Dynamically load polyfills so that we save on bundle size and improve app startup time
    loadLocaleData(locale)
  }, [locale])

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
      }
      if (report.interactive) {
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

    // Used in case we aren't able to resolve notification filtering issues on iOS
    if (isIOS) {
      const notificationsPriceAlertsEnabled = getFeatureFlag(FeatureFlags.NotificationPriceAlertsIOS)
      const notificationsUnfundedWalletEnabled = getFeatureFlag(FeatureFlags.NotificationUnfundedWalletsIOS)

      OneSignal.User.addTags({
        [OneSignalUserTagField.GatingPriceAlertsEnabled]: notificationsPriceAlertsEnabled ? 'true' : 'false',
        [OneSignalUserTagField.GatingUnfundedWalletsEnabled]: notificationsUnfundedWalletEnabled ? 'true' : 'false',
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
                  <DataUpdaters />
                  <NavigationContainer>
                    <MobileWalletNavigationProvider>
                      <WalletUniswapProvider>
                        <BottomSheetModalProvider>
                          <AppModals />
                          <PerformanceProfiler onReportPrepared={onReportPrepared}>
                            <AppInner />
                          </PerformanceProfiler>
                        </BottomSheetModalProvider>
                      </WalletUniswapProvider>
                      <NotificationToastWrapper />
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

  useTestnetModeForLoggingAndAnalytics()

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

function DataUpdaters(): JSX.Element {
  const favoriteTokens: CurrencyId[] = useSelector(selectFavoriteTokens)
  const accountsMap: Record<string, Account> = useAccounts()
  const { locale } = useCurrentLanguageInfo()
  const { code } = useAppFiatCurrencyInfo()

  // Refreshes widgets when bringing app to foreground
  useAppStateTrigger('background', 'active', processWidgetEvents)

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
