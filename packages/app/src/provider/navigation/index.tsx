import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { useMemo } from 'react'
import { useColorScheme } from 'react-native'

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const scheme = useColorScheme()
  return (
    <NavigationContainer
      linking={useMemo(
        () => ({
          prefixes: [Linking.createURL('/')],
          config: {
            initialRouteName: 'home',
            screens: {
              home: '',
              'user-detail': 'user/:id',
            },
          },
        }),
        []
      )}
      theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
    </NavigationContainer>
  )
}
