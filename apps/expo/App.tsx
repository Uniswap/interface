import 'expo-dev-client'
import { useFonts } from 'expo-font'
import React from 'react'
import { Stack } from 'tamagui'
import { Button } from 'ui/src/components/button/Button'
import { Text } from 'ui/src/components/text/Text'
import { Provider } from 'wallet/src/provider/tamagui-provider'

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
        marginTop="$spacing48"
        paddingHorizontal="$spacing16"
        rowGap="$spacing4"
        width="100%">
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
