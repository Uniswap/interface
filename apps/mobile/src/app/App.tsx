import { ApolloProvider } from '@apollo/client'
import {
  DatadogProvider,
  DatadogProviderConfiguration,
  DdRum,
  DdSdkReactNative,
  SdkVerbosity,
} from '@datadog/mobile-react-native'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance'
import { MMKVWrapper } from 'apollo3-cache-persist'
import { PropsWithChildren, default as React, StrictMode, useCallback, useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { LogBox, NativeModules, StatusBar } from 'react-native'
import appsFlyer from 'react-native-appsflyer'
import { getUniqueId } from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { MMKV } from 'react-native-mmkv'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableFreeze } from 'react-native-screens'
import { useDispatch, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { MobileWalletNavigationProvider } from 'src/app/MobileWalletNavigationProvider'
import { AppModals } from 'src/app/modals/AppModals'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { persistor, store } from 'src/app/store'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { AIAssistantScreen } from 'src/features/openai/AIAssistantScreen'
import { OpenAIContextProvider } from 'src/features/openai/OpenAIContext'
import { shouldLogScreen } from 'src/features/telemetry/directLogScreens'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import {
  processWidgetEvents,
  setAccountAddressesUserDefaults,
  setFavoritesUserDefaults,
  setI18NUserDefaults,
} from 'src/features/widgets/widgets'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { getSentryEnvironment, getSentryTracesSamplingRate, getStatsigEnvironmentTier } from 'src/utils/version'
import { flexStyles, useHapticFeedback, useIsDarkMode } from 'ui/src'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { DUMMY_STATSIG_SDK_KEY, StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, WALLET_FEATURE_FLAG_NAMES, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import {
  getFeatureFlagWithExposureLoggingDisabled,
  useFeatureFlag,
  useFeatureFlagWithExposureLoggingDisabled,
} from 'uniswap/src/features/gating/hooks'
import { loadStatsigOverrides } from 'uniswap/src/features/gating/overrides/customPersistedOverrides'
import { Statsig, StatsigOptions, StatsigProvider, StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { syncAppWithDeviceLanguage } from 'uniswap/src/features/settings/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n/i18n'
import { CurrencyId } from 'uniswap/src/types/currency'
import { isDetoxBuild, isJestRun } from 'utilities/src/environment/constants'
import { attachUnhandledRejectionHandler } from 'utilities/src/logger/Datadog'
import { registerConsoleOverrides } from 'utilities/src/logger/console'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { TestnetModeBanner } from 'wallet/src/components/banners/TestnetModeBanner'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks'
// eslint-disable-next-line no-restricted-imports
import { usePersistedApolloClient } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { initFirebaseAppCheck } from 'wallet/src/features/appCheck/appCheck'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { selectHapticsEnabled } from 'wallet/src/features/appearance/slice'
import { clearNotificationQueue } from 'wallet/src/features/notifications/slice'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'
import { beforeSend } from 'wallet/src/utils/sentry'

enableFreeze(true)

if (__DEV__) {
  registerConsoleOverrides()
}

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

if (!__DEV__ && !isDetoxBuild) {
  Sentry.init({
    environment: getSentryEnvironment(),
    dsn: config.sentryDsn,
    attachViewHierarchy: true,
    enableCaptureFailedRequests: true,
    tracesSampleRate: getSentryTracesSamplingRate(),
    integrations: [
      new Sentry.ReactNativeTracing({
        enableUserInteractionTracing: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation,
      }),
    ],
    // By default, the Sentry SDK normalizes any context to a depth of 3.
    // We're increasing this to be able to see the full depth of the Redux state.
    normalizeDepth: 10,
    beforeSend,
  })
}

// Datadog
const datadogConfig = new DatadogProviderConfiguration(
  config.datadogClientToken,
  getSentryEnvironment(),
  config.datadogProjectId,
  !__DEV__, // trackInteractions
  !__DEV__, // trackResources
  !__DEV__, // trackErrors
)
datadogConfig.site = 'US1'
datadogConfig.longTaskThresholdMs = 100
datadogConfig.nativeCrashReportEnabled = true
datadogConfig.verbosity = SdkVerbosity.INFO
// Datadog does not expose event type, hence we can not type return
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
datadogConfig.errorEventMapper = (event) => {
  // this is Sentry error, which is caused by the not complete closing of their SDK
  if (event.message.includes('Native is disabled')) {
    return null
  }
  return event
}

// Log boxes on simulators can block detox tap event when they cover buttons placed at
// the bottom of the screen and cause tests to fail.
if (isDetoxBuild) {
  LogBox.ignoreAllLogs()
}

initOneSignal()
initAppsFlyer()
initFirebaseAppCheck()

function App(): JSX.Element | null {
  // Here Statsig is not yet initialised
  const [isDatadogEnabled, setIsDatadogEnabled] = useState(false)
  useEffect(() => {
    if (!__DEV__ && !isDetoxBuild && isDatadogEnabled) {
      // We can not use both Datadog and Sentry because their error catchers conflict.
      // We need to wait until Statsig loads feature flags to chose Datadog or Sentry.
      // If we initialise Sentry async - some of its features do not work properly (for some reason)
      // Hence we always initiliase and later close it if Datadog is enabled.
      Sentry.close().catch(() => undefined)
      attachUnhandledRejectionHandler()
    }
  }, [isDatadogEnabled])

  // We want to ensure deviceID is used as the identifier to link with analytics
  const fetchAndSetDeviceId = useCallback(async () => {
    const uniqueId = await getUniqueId()
    if (isDatadogEnabled) {
      DdSdkReactNative.setUser({
        id: uniqueId,
      }).catch(() => undefined)
    } else {
      Sentry.setUser({
        id: uniqueId,
      })
    }
    return uniqueId
  }, [isDatadogEnabled])

  const deviceId = useAsyncData(fetchAndSetDeviceId).data

  const statSigOptions: {
    user: StatsigUser
    options: StatsigOptions
    sdkKey: string
    waitForInitialization: boolean
  } = {
    options: {
      environment: {
        tier: getStatsigEnvironmentTier(),
      },
      api: uniswapUrls.statsigProxyUrl,
      disableAutoMetricsLogging: true,
      disableErrorLogging: true,
      initCompletionCallback: () => {
        loadStatsigOverrides()
        setIsDatadogEnabled(Statsig.checkGate(getFeatureFlagName(FeatureFlags.Datadog)))
      },
    },
    sdkKey: DUMMY_STATSIG_SDK_KEY,
    user: {
      ...(deviceId ? { userID: deviceId } : {}),
      custom: {
        app: StatsigCustomAppValue.Mobile,
      },
    },
    waitForInitialization: true,
  }

  return (
    <StatsigProvider {...statSigOptions}>
      <DatadogProviderWrapper>
        <Trace>
          <StrictMode>
            <I18nextProvider i18n={i18n}>
              <SentryTags>
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
              </SentryTags>
            </I18nextProvider>
          </StrictMode>
        </Trace>
      </DatadogProviderWrapper>
    </StatsigProvider>
  )
}

function DatadogProviderWrapper({ children }: PropsWithChildren): JSX.Element {
  const datadogEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.Datadog)

  if (isDetoxBuild || isJestRun || !datadogEnabled) {
    return <>{children}</>
  }
  return <DatadogProvider configuration={datadogConfig}>{children}</DatadogProvider>
}

function SentryTags({ children }: PropsWithChildren): JSX.Element {
  useEffect(() => {
    const isDatadogEnabled = getFeatureFlagWithExposureLoggingDisabled(FeatureFlags.Datadog)

    for (const [_, flagKey] of WALLET_FEATURE_FLAG_NAMES.entries()) {
      if (isDatadogEnabled) {
        DdRum.addFeatureFlagEvaluation(
          // Datadog has a limited set of accepted symbols in feature flags
          // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
          flagKey.replaceAll('-', '_'),
          Statsig.checkGateWithExposureLoggingDisabled(flagKey),
        ).catch(() => undefined)
      } else {
        Sentry.setTag(`featureFlag.${flagKey}`, Statsig.checkGateWithExposureLoggingDisabled(flagKey))
      }
    }

    for (const experiment of Object.values(Experiments)) {
      if (isDatadogEnabled) {
        DdRum.addFeatureFlagEvaluation(
          // Datadog has a limited set of accepted symbols in feature flags
          // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
          `experiment_${experiment.replaceAll('-', '_')}`,
          Statsig.getExperimentWithExposureLoggingDisabled(experiment).getGroupName(),
        ).catch(() => undefined)
      } else {
        Sentry.setTag(
          `experiment.${experiment}`,
          Statsig.getExperimentWithExposureLoggingDisabled(experiment).getGroupName(),
        )
      }
    }
  }, [])

  return <>{children}</>
}

const MAX_CACHE_SIZE_IN_BYTES = 1024 * 1024 * 25 // 25 MB

// Ensures redux state is available inside usePersistedApolloClient for the custom endpoint
function AppOuter(): JSX.Element | null {
  const customEndpoint = useSelector(selectCustomEndpoint)
  const client = usePersistedApolloClient({
    storageWrapper: new MMKVWrapper(new MMKV()),
    maxCacheSizeInBytes: MAX_CACHE_SIZE_IN_BYTES,
    customEndpoint,
  })

  const onReportPrepared = useCallback((report: RenderPassReport) => {
    sendAnalyticsEvent(MobileEventName.PerformanceReport, report)
  }, [])

  if (!client) {
    return null
  }

  return (
    <ApolloProvider client={client}>
      <PersistGate loading={null} persistor={persistor}>
        <ErrorBoundary>
          <LocalizationContextProvider>
            <GestureHandlerRootView style={flexStyles.fill}>
              <WalletContextProvider>
                <UnitagUpdaterContextProvider>
                  <BiometricContextProvider>
                    <LockScreenContextProvider>
                      <Sentry.TouchEventBoundary>
                        <DataUpdaters />
                        <NavigationContainer
                          onReady={(navigationRef): void => {
                            routingInstrumentation.registerNavigationContainer(navigationRef)
                          }}
                        >
                          <MobileWalletNavigationProvider>
                            <OpenAIContextProvider>
                              <WalletUniswapProvider>
                                <BottomSheetModalProvider>
                                  <AppModals />
                                  <PerformanceProfiler onReportPrepared={onReportPrepared}>
                                    <AppInner />
                                  </PerformanceProfiler>
                                </BottomSheetModalProvider>
                              </WalletUniswapProvider>
                              <NotificationToastWrapper />
                            </OpenAIContextProvider>
                          </MobileWalletNavigationProvider>
                        </NavigationContainer>
                      </Sentry.TouchEventBoundary>
                    </LockScreenContextProvider>
                  </BiometricContextProvider>
                </UnitagUpdaterContextProvider>
              </WalletContextProvider>
            </GestureHandlerRootView>
          </LocalizationContextProvider>
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
  const hapticsUserEnabled = useSelector(selectHapticsEnabled)
  const { setHapticsEnabled } = useHapticFeedback()

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

  // Sets haptics for the UI library based on the user redux setting
  useEffect(() => {
    setHapticsEnabled(hapticsUserEnabled)
  }, [hapticsUserEnabled, setHapticsEnabled])

  useEffect(() => {
    dispatch(clearNotificationQueue()) // clear all in-app toasts on app start
    dispatch(syncAppWithDeviceLanguage())
  }, [dispatch])

  useEffect(() => {
    // TODO: This is a temporary solution (it should be replaced with Appearance.setColorScheme
    // after updating RN to 0.72.0 or higher)
    NativeModules.ThemeModule.setColorScheme(themeSetting)
  }, [themeSetting])

  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)

  return (
    <>
      {openAIAssistantEnabled && <AIAssistantScreen />}
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getApp() {
  return __DEV__ ? App : Sentry.wrap(App)
}

export default getApp()
