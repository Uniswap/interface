import { ApolloProvider } from '@apollo/client'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import * as SplashScreen from 'expo-splash-screen'
import React, { StrictMode, useCallback, useEffect } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppModals } from 'src/app/modals/AppModals'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { OfflineBanner } from 'src/components/banners/OfflineBanner'
import { Trace } from 'src/components/telemetry/Trace'
import { TraceUserProperties } from 'src/components/telemetry/TraceUserProperties'
import { config } from 'src/config'
import { usePersistedApolloClient } from 'src/data/hooks'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { initializeRemoteConfig } from 'src/features/remoteConfig'
import { MarkNames } from 'src/features/telemetry/constants'
import { TransactionHistoryUpdater } from 'src/features/transactions/TransactionHistoryUpdater'
import { useTrmPrefetch } from 'src/features/trm/api'
import { useSignerAccounts } from 'src/features/wallet/hooks'
import { DynamicThemeProvider } from 'src/styles/DynamicThemeProvider'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

// Keep the splash screen visible while we fetch resources until one of our landing pages loads
SplashScreen.preventAutoHideAsync()

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampler: (_) => {
      return 0.2
    },
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation,
      }),
    ],
  })
}

initializeRemoteConfig()
initOneSignal()

function App(): JSX.Element | null {
  const client = usePersistedApolloClient()

  if (!client) {
    // TODO: [MOB-3515] delay splash screen until client is rehydated
    return null
  }

  return (
    <Trace startMark={MarkNames.AppStartup}>
      <StrictMode>
        <SafeAreaProvider>
          <Provider store={store}>
            <ApolloProvider client={client}>
              <PersistGate loading={null} persistor={persistor}>
                <DynamicThemeProvider>
                  <ErrorBoundary>
                    <WalletContextProvider>
                      <BiometricContextProvider>
                        <LockScreenContextProvider>
                          <DataUpdaters />
                          <BottomSheetModalProvider>
                            <AppModals />
                            <AppInner />
                          </BottomSheetModalProvider>
                        </LockScreenContextProvider>
                      </BiometricContextProvider>
                    </WalletContextProvider>
                  </ErrorBoundary>
                </DynamicThemeProvider>
              </PersistGate>
            </ApolloProvider>
          </Provider>
        </SafeAreaProvider>
      </StrictMode>
    </Trace>
  )
}

function AppInner(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <Trace endMark={MarkNames.AppStartup}>
      <NavStack isDarkMode={isDarkMode} />
    </Trace>
  )
}

const PREFETCH_OPTIONS = {
  ifOlderThan: 60 * 15, // cache results for 15 minutes
}

function DataUpdaters(): JSX.Element {
  const signerAccounts = useSignerAccounts()
  const prefetchTrm = useTrmPrefetch()

  const prefetchTrmData = useCallback(
    () =>
      signerAccounts.forEach((account) => {
        prefetchTrm(account.address, PREFETCH_OPTIONS)
      }),
    [prefetchTrm, signerAccounts]
  )

  // Prefetch TRM data on app start (either cold or warm)
  useEffect(prefetchTrmData, [prefetchTrmData])
  useAppStateTrigger('background', 'active', prefetchTrmData)
  useAppStateTrigger('inactive', 'active', prefetchTrmData)

  return (
    <>
      <TraceUserProperties />
      <TransactionHistoryUpdater />
    </>
  )
}

function NavStack({ isDarkMode }: { isDarkMode: boolean }): JSX.Element {
  return (
    <NavigationContainer
      onReady={(navigationRef): void => {
        routingInstrumentation.registerNavigationContainer(navigationRef)
      }}>
      <OfflineBanner />
      <NotificationToastWrapper />
      <AppStackNavigator />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </NavigationContainer>
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getApp() {
  return __DEV__ ? App : Sentry.wrap(App)
}

export default getApp()
