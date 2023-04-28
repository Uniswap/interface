import 'expo-dev-client'
import { Provider } from 'wallet/src/provider/tamagui-provider'
import React from 'react'
import { Stack } from 'tamagui'
import { Button } from 'ui/src/components/button/Button'
import { Text } from 'ui/src/components/text/Text'
import { useFonts } from 'expo-font'

export default function App(): JSX.Element | null {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  if (!loaded) {
    return null
  }
  return (
    <Provider>
      <Stack
        alignItems="center"
        width="100%"
        marginTop="$spacing48"
        paddingHorizontal="$spacing16"
        rowGap="$spacing4">
        <Text variant="headlineLarge">This is App</Text>
        <Text variant="headlineSmall">Enjoy buttons</Text>
        <Button theme="primary">One</Button>
        <Button theme="secondary">Two</Button>
        <Button theme="tertiary">Three</Button>
        <Button theme="warning">Warning</Button>
        <Button theme="detrimental">Detrimental</Button>
      </Stack>
    </Provider>
  )
}
