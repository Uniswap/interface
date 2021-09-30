import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ThemeProvider } from '@shopify/restyle'
import React from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { RootStackParamList } from 'src/app/navTypes'
import { store } from 'src/app/store'
import { HomeScreen } from 'src/features/home/HomeScreen'
import { TransferTokenScreen } from 'src/features/transfer/TransferTokenScreen'
import { darkTheme, theme } from 'src/styles/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function App() {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Uniswap | Home' }}
              />
              <Stack.Screen
                name="Transfer"
                component={TransferTokenScreen}
                options={{ title: 'Uniswap | Send' }}
              />
            </Stack.Navigator>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )
}
