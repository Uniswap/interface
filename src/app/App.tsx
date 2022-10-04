import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import * as SplashScreen from 'expo-splash-screen'
import React, { StrictMode, Suspense, useCallback, useEffect, useState } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { RelayEnvironmentProvider } from 'react-relay'
import { useRestore } from 'react-relay-offline'
import { PersistGate } from 'redux-persist/integration/react'
import { RelayEnvironmentProvider as RelayHooksEnvironmentProvider } from 'relay-hooks'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppModals } from 'src/app/modals/AppModals'
import { DrawerNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { RelayEnvironment } from 'src/data/relay'
import { LockScreenContextProvider } from 'src/features/authentication/lockScreenContext'
import { BiometricContextProvider } from 'src/features/biometrics/context'
import { initExperiments } from 'src/features/experiments/experiments'
import { MulticallUpdaters } from 'src/features/multicall'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { initOneSignal } from 'src/features/notifications/Onesignal'
import { initializeRemoteConfig } from 'src/features/remoteConfig'
import { initAnalytics } from 'src/features/telemetry'
import { MarkNames } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { TransactionHistoryUpdater } from 'src/features/transactions/TransactionHistoryUpdater'
import { useAccounts } from 'src/features/wallet/hooks'
import { DynamicThemeProvider } from 'src/styles/DynamicThemeProvider'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampler: (_) => {
      // Lower to ~20% before going live: MOB-1634
      return 1
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
initAnalytics()
initExperiments()

function App() {
  return (
    <Trace startMark={MarkNames.AppStartup}>
      <StrictMode>
        <SafeAreaProvider>
          <Provider store={store}>
            <RelayEnvironmentProvider environment={RelayEnvironment}>
              <RelayHooksEnvironmentProvider environment={RelayEnvironment}>
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
              </RelayHooksEnvironmentProvider>
            </RelayEnvironmentProvider>
          </Provider>
        </SafeAreaProvider>
      </StrictMode>
    </Trace>
  )
}

function AppInner() {
  const isDarkMode = useColorScheme() === 'dark'

  const [appIsReady, setAppIsReady] = useState(false)
  const isRehydrated = useRestore(RelayEnvironment)
  useEffect(() => {
    // wait for hydration of persistent data in memory
    if (isRehydrated) {
      setAppIsReady(true)
    }
  }, [isRehydrated])

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if (!appIsReady) {
    return null
  }

  return (
    <Trace endMark={MarkNames.AppStartup}>
      <NavStack isDarkMode={isDarkMode} onReady={onLayoutRootView} />
    </Trace>
  )
}

function DataUpdaters() {
  const accounts = useAccounts()
  const addresses = Object.keys(accounts)
  // TODO: Once TransactionHistoryUpdaterQuery can accept an array of addresses,
  // use `useQueryLoader` to load the query within `InteractionManager.runAfterInteractions`
  // and pass the query ref to the `TransactionHistoryUpdater` component
  return (
    <>
      {addresses.map((address) => (
        <Suspense key={address} fallback={null}>
          <TransactionHistoryUpdater address={address} />
        </Suspense>
      ))}
      <MulticallUpdaters />
      <TokenListUpdater />
    </>
  )
}

function NavStack({ isDarkMode, onReady }: { isDarkMode: boolean; onReady: () => void }) {
  return (
    <NavigationContainer
      onReady={(navigationRef) => {
        routingInstrumentation.registerNavigationContainer(navigationRef)
        onReady()
      }}>
      <NotificationToastWrapper>
        <DrawerNavigator />
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      </NotificationToastWrapper>
    </NavigationContainer>
  )
}

function getApp() {
  return __DEV__ ? App : Sentry.wrap(App)
}

export default getApp()
