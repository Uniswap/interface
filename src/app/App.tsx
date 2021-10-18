import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Sentry from '@sentry/react-native'
import { ThemeProvider } from '@shopify/restyle'
import React, { StrictMode } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { ErrorBoundary } from 'src/app/ErrorBoundary'
import { useAppSelector } from 'src/app/hooks'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { store } from 'src/app/store'
import { WalletContextProvider } from 'src/app/walletContext'
import { config } from 'src/config'
import { HomeScreen } from 'src/features/home/HomeScreen'
import { CameraScreen } from 'src/features/import/CameraScreen'
import { SeedPhraseScreen } from 'src/features/import/SeedPhraseScreen'
import { MulticallUpdater } from 'src/features/multicall'
import { ImportAccountScreen } from 'src/features/onboarding/ImportAccountScreen'
import { WelcomeScreen } from 'src/features/onboarding/WelcomeScreen'
import { TransferTokenScreen } from 'src/features/transfer/TransferTokenScreen'
import { darkTheme, theme } from 'src/styles/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
  })
}

export function App() {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <StrictMode>
      <SafeAreaProvider>
        <Provider store={store}>
          <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
            <ErrorBoundary>
              <WalletContextProvider>
                <MulticallUpdater />
                <NavStack isDarkMode={isDarkMode} />
              </WalletContextProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </StrictMode>
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
              name={Screens.Home}
              component={HomeScreen}
              options={{ title: 'Uniswap | Home' }}
            />
            <Stack.Screen
              name={Screens.Transfer}
              component={TransferTokenScreen}
              options={{ title: 'Uniswap | Send' }}
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
