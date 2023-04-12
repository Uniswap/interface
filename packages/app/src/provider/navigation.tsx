import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import { useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { Flex } from 'ui/src/components/layout/Flex'

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
      theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Flex minWidth={350}>{children}</Flex>
    </NavigationContainer>
  )
}
