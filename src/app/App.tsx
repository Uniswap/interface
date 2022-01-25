import * as Sentry from '@sentry/react-native'
import { ThemeProvider } from '@shopify/restyle'
import React, { StrictMode } from 'react'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider, setLogger } from 'react-query'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { AppStackNavigator } from 'src/app/navigation/navigation'
import { NavigationContainer } from 'src/app/navigation/NavigationContainer'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { MulticallUpdaters } from 'src/features/multicall'
import { NotificationBannerWrapper } from 'src/features/notifications/NotificationBanner'
import { initializeRemoteConfig } from 'src/features/remoteConfig'
import { enableAnalytics } from 'src/features/telemetry'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { darkTheme, theme } from 'src/styles/theme'

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

const queryClient = new QueryClient()

export function App() {
  const isDarkMode = false // useColorScheme() === 'dark'

  return (
    <StrictMode>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
              <ErrorBoundary>
                <WalletContextProvider>
                  <DataUpdaters />
                  <QueryClientProvider client={queryClient}>
                    <NotificationBannerWrapper>
                      <NavStack isDarkMode={isDarkMode} />
                    </NotificationBannerWrapper>
                  </QueryClientProvider>
                </WalletContextProvider>
              </ErrorBoundary>
            </ThemeProvider>
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
    </NavigationContainer>
  )
}
