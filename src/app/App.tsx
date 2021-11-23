import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Sentry from '@sentry/react-native'
import { ThemeProvider } from '@shopify/restyle'
import React, { StrictMode } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { MulticallUpdaters } from 'src/features/multicall'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { BalancesScreen } from 'src/screens/BalancesScreen'
import { CameraScreen } from 'src/screens/CameraScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportAccountScreen } from 'src/screens/ImportAccountScreen'
import { RootStackParamList } from 'src/screens/navTypes'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { Screens } from 'src/screens/Screens'
import { SeedPhraseScreen } from 'src/screens/SeedPhraseScreen'
import { SwapConfigScreen } from 'src/screens/SwapConfigScreen'
import { SwapScreen } from 'src/screens/SwapScreen'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { TransferTokenScreen } from 'src/screens/TransferTokenScreen'
import { darkTheme, theme } from 'src/styles/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

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
      <Stack.Navigator>
        <Stack.Screen
          name={Screens.Dev}
          component={DevScreen}
          options={{ title: 'Uniswap | Dev Screen' }}
        />
        <Stack.Screen name={Screens.Home} component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name={Screens.Balances}
          component={BalancesScreen}
          options={{ title: 'Uniswap | Balances' }}
        />
        <Stack.Screen
          name={Screens.TokenDetails}
          component={TokenDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={Screens.Notifications}
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={Screens.Transfer}
          component={TransferTokenScreen}
          options={{ title: 'Uniswap | Send' }}
        />
        <Stack.Screen
          name={Screens.Accounts}
          component={AccountsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={Screens.Camera}
          component={CameraScreen}
          options={{ title: 'Uniswap | Camera' }}
        />
        <Stack.Screen
          name={Screens.SeedPhrase}
          component={SeedPhraseScreen}
          options={{ title: 'Uniswap | Seed Phrase' }}
        />
        <Stack.Screen
          name={Screens.ImportAccount}
          component={ImportAccountScreen}
          options={{ title: 'Uniswap | Import' }}
        />
        <Stack.Screen
          name={Screens.Swap}
          component={SwapScreen}
          options={{ title: 'Uniswap | Swap' }}
        />
        <Stack.Screen
          name={Screens.SwapConfig}
          component={SwapConfigScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </NavigationContainer>
  )
}
