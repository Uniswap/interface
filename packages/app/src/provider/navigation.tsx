import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { useMemo } from 'react'
import { useColorScheme } from 'react-native'

export function NavigationProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const scheme = useColorScheme()
  return (
    <NavigationContainer
      linking={useMemo(
        () => ({
          prefixes: [],
          config: {
            initialRouteName: 'home',
            screens: {
              home: '',
            },
          },
        }),
        []
      )}
      theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      {children}
    </NavigationContainer>
  )
}
