import { NavigationContainer } from '@react-navigation/native'
import * as Sentry from '@sentry/react-native'
import { ThemeProvider } from '@shopify/restyle'
import React, { StrictMode } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { SwapStackNavigator } from 'src/app/navigation/navigation'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { MulticallUpdaters } from 'src/features/multicall'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { darkTheme, theme } from 'src/styles/theme'

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
  })
}

const queryClient = new QueryClient()

export function App() {
  const isDarkMode = useColorScheme() === 'dark'

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
                    <NavStack isDarkMode={isDarkMode} />
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
      <SwapStackNavigator />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </NavigationContainer>
  )
}
