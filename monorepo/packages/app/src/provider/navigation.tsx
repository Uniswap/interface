import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import { useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { YStack } from 'tamagui'

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
      <YStack backgroundColor="$background2">
        <YStack
          backgroundColor="$background1"
          borderRadius="$rounded24"
          flex={1}
          flexGrow={1}
          margin="$spacing12"
          minHeight={576} // Subtract 2 * $spacing12 from 600 height
          overflow="hidden"
          width={350}>
          {children}
        </YStack>
      </YStack>
    </NavigationContainer>
  )
}
