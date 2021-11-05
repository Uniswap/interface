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
import { useAppSelector } from 'src/app/hooks'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { persistor, store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { BalancesScreen } from 'src/features/balances/BalancesScreen'
import { CameraScreen } from 'src/features/import/CameraScreen'
import { SeedPhraseScreen } from 'src/features/import/SeedPhraseScreen'
import { MulticallUpdaters } from 'src/features/multicall'
import { ImportAccountScreen } from 'src/features/onboarding/ImportAccountScreen'
import { WelcomeScreen } from 'src/features/onboarding/WelcomeScreen'
import { TokenListUpdater } from 'src/features/tokenLists/updater'
import { TokenDetailsScreen } from 'src/features/tokens/TokenDetailsScreen'
import { TransferTokenScreen } from 'src/features/transfer/TransferTokenScreen'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
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
  const isUnlocked = useAppSelector((state) => state.wallet.isUnlocked)
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isUnlocked ? (
          <>
            <Stack.Screen
              name={Screens.Dev}
              component={DevScreen}
              options={{ title: 'Uniswap | Home' }}
            />
            <Stack.Screen
              name={Screens.Balances}
              component={BalancesScreen}
              options={{ title: 'Uniswap | Balances' }}
            />
            <Stack.Screen
              name={Screens.TokenDetails}
              component={TokenDetailsScreen}
              options={{ title: 'Uniswap | Token' }}
            />
            <Stack.Screen
              name={Screens.Transfer}
              component={TransferTokenScreen}
              options={{ title: 'Uniswap | Send' }}
            />
            <Stack.Screen
              name={Screens.Home}
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={Screens.Accounts}
              component={AccountsScreen}
              options={{ title: 'Uniswap | Accounts' }}
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
          </>
        ) : (
          <>
            <Stack.Screen
              name={Screens.Welcome}
              component={WelcomeScreen}
              options={{ title: 'Uniswap | Welcome' }}
            />
            <Stack.Screen
              name={Screens.ImportAccount}
              component={ImportAccountScreen}
              options={{ title: 'Uniswap | Import' }}
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
          </>
        )}
      </Stack.Navigator>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </NavigationContainer>
  )
}
