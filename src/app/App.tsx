import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Sentry from '@sentry/react-native'
import React, { StrictMode } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { enableLayoutAnimations } from 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { setLogger } from 'react-query'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { QueryProvider } from 'src/app/QueryProvider'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { BiometricCheck } from 'src/features/biometrics'
import { MulticallUpdaters } from 'src/features/multicall'
import { NotificationBannerWrapper } from 'src/features/notifications/NotificationBanner'
import { initializeRemoteConfig } from 'src/features/remoteConfig'
import { enableAnalytics } from 'src/features/telemetry'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { DynamicThemeProvider } from 'src/styles/DynamicThemeProvider'

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
  })
}

setLogger({
  log: (message) => {
    Sentry.captureMessage(message)
  },
  warn: (message) => {
    Sentry.captureMessage(message)
  },
  error: (error) => {
    Sentry.captureException(error)
  },
})

initializeRemoteConfig()
enableAnalytics()
// https://github.com/software-mansion/react-native-reanimated/issues/2758
enableLayoutAnimations(true)

export function App() {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <StrictMode>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <DynamicThemeProvider>
              <ErrorBoundary>
                <WalletContextProvider>
                  <DataUpdaters />
                  <QueryProvider>
                    <BottomSheetModalProvider>
                      <NotificationBannerWrapper>
                        <NavStack isDarkMode={isDarkMode} />
                      </NotificationBannerWrapper>
                    </BottomSheetModalProvider>
                  </QueryProvider>
                </WalletContextProvider>
              </ErrorBoundary>
            </DynamicThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </StrictMode>
  )
}

function DataUpdaters() {
  return (
    <>
      <MulticallUpdaters />
      <TokenListUpdater />
    </>
  )
}

function NavStack({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <NavigationContainer>
      <AppStackNavigator />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <BiometricCheck />
    </NavigationContainer>
  )
}
