import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import React, { StrictMode, Suspense } from 'react'
import { StatusBar, Text, useColorScheme, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { RelayEnvironmentProvider } from 'react-relay'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppModals } from 'src/app/modals/AppModals'
import { DrawerNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { useStorageMigrator } from 'src/data/migrateStorage'
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
  // TODO(MOB-2795): remove once most devices are migrated
  const hasMigrated = useStorageMigrator()

  if (!hasMigrated) {
    // show loading while storage is being migrated
    return (
      // temporary change
      // eslint-disable-next-line react-native/no-inline-styles
      <View style={{ margin: 50, top: 100 }}>
        <Text
          style={
            // eslint-disable-next-line react-native/no-inline-styles
            { color: 'red', fontSize: 25 }
          }>
          Migrating local storage. This may take a few minutes...
        </Text>
      </View>
    )
  }

  return (
    <Trace startMark={MarkNames.AppStartup}>
      <StrictMode>
        <SafeAreaProvider>
          <Provider store={store}>
            <Trace startMark={MarkNames.RelayRestore}>
              <RelayEnvironmentProvider environment={RelayEnvironment}>
                <Trace endMark={MarkNames.RelayRestore}>
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
                </Trace>
              </RelayEnvironmentProvider>
            </Trace>
          </Provider>
        </SafeAreaProvider>
      </StrictMode>
    </Trace>
  )
}

function AppInner() {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <Trace endMark={MarkNames.AppStartup}>
      <NavStack isDarkMode={isDarkMode} />
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

function NavStack({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <NavigationContainer
      onReady={(navigationRef) => {
        routingInstrumentation.registerNavigationContainer(navigationRef)
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
