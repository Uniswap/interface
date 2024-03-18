import { ApolloProvider } from '@apollo/client'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import { PerformanceProfiler, RenderPassReport } from '@shopify/react-native-performance'
import { PropsWithChildren, default as React, StrictMode, useCallback, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { LogBox, NativeModules, StatusBar } from 'react-native'
import appsFlyer from 'react-native-appsflyer'
import { getUniqueId } from 'react-native-device-info'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableFreeze } from 'react-native-screens'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { MobileWalletNavigationProvider } from 'src/app/MobileWalletNavigationProvider'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppModals } from 'src/app/modals/AppModals'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { persistor, store } from 'src/app/store'
import Trace from 'src/components/Trace/Trace'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import { usePersistedApolloClient } from 'src/data/usePersistedApolloClient'
import { initAppsFlyer } from 'src/features/analytics/appsflyer'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { shouldLogScreen } from 'src/features/telemetry/directLogScreens'
import { selectAllowAnalytics } from 'src/features/telemetry/selectors'
import {
  processWidgetEvents,
  setAccountAddressesUserDefaults,
  setFavoritesUserDefaults,
  setI18NUserDefaults,
} from 'src/features/widgets/widgets'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { getSentryEnvironment, getStatsigEnvironmentTier } from 'src/utils/version'
import { Statsig, StatsigProvider } from 'statsig-react-native'
import { flexStyles, useIsDarkMode } from 'ui/src'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import { isDetoxBuild } from 'utilities/src/environment'
import { registerConsoleOverrides } from 'utilities/src/logger/console'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { initFirebaseAppCheck } from 'wallet/src/features/appCheck'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import {
  DUMMY_STATSIG_SDK_KEY,
  EXPERIMENT_NAMES,
  FEATURE_FLAGS,
} from 'wallet/src/features/experiments/constants'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { LocalizationContextProvider } from 'wallet/src/features/language/LocalizationContext'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { updateLanguage } from 'wallet/src/features/language/slice'
import { clearNotificationQueue } from 'wallet/src/features/notifications/slice'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletContextProvider } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import i18n from 'wallet/src/i18n/i18n'
import { SharedProvider } from 'wallet/src/provider'
import { CurrencyId } from 'wallet/src/utils/currencyId'
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
    tracesSampler: (_) => {
      return 0.2
    },
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

// Log boxes on simulators can block detox tap event when they cover buttons placed at
// the bottom of the screen and cause tests to fail.
if (isDetoxBuild) {
  LogBox.ignoreAllLogs()
}

initOneSignal()
initAppsFlyer()
initFirebaseAppCheck()

function App(): JSX.Element | null {
  // We want to ensure deviceID is used as the identifier to link with analytics
  const fetchAndSetDeviceId = useCallback(async () => {
    const uniqueId = await getUniqueId()
    Sentry.setUser({
      id: uniqueId,
    })
    return uniqueId
  }, [])

  const deviceId = useAsyncData(fetchAndSetDeviceId).data

  const statSigOptions = {
    options: {
      environment: {
        tier: getStatsigEnvironmentTier(),
      },
      api: uniswapUrls.statsigProxyUrl,
      disableAutoMetricsLogging: true,
      disableErrorLogging: true,
    },
    sdkKey: DUMMY_STATSIG_SDK_KEY,
    user: deviceId ? { userID: deviceId } : {},
    waitForInitialization: true,
  }

  return (
    <Trace>
      <StrictMode>
        <I18nextProvider i18n={i18n}>
          <StatsigProvider {...statSigOptions}>
            <SentryTags>
              <SafeAreaProvider>
                <SharedProvider reduxStore={store}>
                  <AnalyticsNavigationContextProvider
                    shouldLogScreen={shouldLogScreen}
                    useIsPartOfNavigationTree={useIsPartOfNavigationTree}>
                    <AppOuter />
                  </AnalyticsNavigationContextProvider>
                </SharedProvider>
              </SafeAreaProvider>
            </SentryTags>
          </StatsigProvider>
        </I18nextProvider>
      </StrictMode>
    </Trace>
  )
}

function SentryTags({ children }: PropsWithChildren): JSX.Element {
  useEffect(() => {
    Object.entries(FEATURE_FLAGS).map(([_, featureFlagName]) => {
      Sentry.setTag(
        `featureFlag.${featureFlagName}`,
        Statsig.checkGateWithExposureLoggingDisabled(featureFlagName)
      )
    })

    Object.entries(EXPERIMENT_NAMES).map(([_, experimentName]) => {
      Sentry.setTag(
        `experiment.${experimentName}`,
        Statsig.getExperimentWithExposureLoggingDisabled(experimentName).getGroupName()
      )
    })
  }, [])

  return <>{children}</>
}

// Ensures redux state is available inside usePersistedApolloClient for the custom endpoint
function AppOuter(): JSX.Element | null {
  const client = usePersistedApolloClient()

  const onReportPrepared = useCallback((report: RenderPassReport) => {
    sendMobileAnalyticsEvent(MobileEventName.PerformanceReport, report)
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
                          }}>
                          <MobileWalletNavigationProvider>
                            <BottomSheetModalProvider>
                              <AppModals />
                              <PerformanceProfiler onReportPrepared={onReportPrepared}>
                                <AppInner />
                              </PerformanceProfiler>
                            </BottomSheetModalProvider>
                            <NotificationToastWrapper />
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
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()
  const themeSetting = useCurrentAppearanceSetting()
  const allowAnalytics = useAppSelector(selectAllowAnalytics)

  useEffect(() => {
    if (allowAnalytics) {
      appsFlyer.startSdk()
      logger.info('AppsFlyer', 'status', 'started')
    } else {
      appsFlyer.stop(!allowAnalytics, (res: unknown) => {
        if (typeof res === 'string' && res === 'Success') {
          logger.info('AppsFlyer', 'status', 'stopped')
        } else {
          logger.warn(
            'AppsFlyer',
            'stop',
            `Got an error when trying to stop the AppsFlyer SDK: ${res}`
          )
        }
      })
    }
  }, [allowAnalytics])

  useEffect(() => {
    dispatch(clearNotificationQueue()) // clear all in-app toasts on app start
    dispatch(updateLanguage(null))
  }, [dispatch])

  useEffect(() => {
    // TODO: This is a temporary solution (it should be replaced with Appearance.setColorScheme
    // after updating RN to 0.72.0 or higher)
    NativeModules.ThemeModule.setColorScheme(themeSetting)
  }, [themeSetting])

  return (
    <>
      <OfflineBanner />
      <AppStackNavigator />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
    </>
  )
}

function DataUpdaters(): JSX.Element {
  const favoriteTokens: CurrencyId[] = useAppSelector(selectFavoriteTokens)
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
