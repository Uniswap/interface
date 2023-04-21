import 'expo-dev-client'
import { Provider } from 'wallet/src/provider/tamagui-provider'
import React from 'react'
import { Stack } from 'tamagui'
import { Button, ButtonEmphasis } from 'ui/src/components/button/Button'
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
        marginTop="$spacing48"
        paddingHorizontal="$spacing16"
        paddingTop="$spacing60"
        rowGap="$spacing4">
        <Text variant="headlineLarge">This is App</Text>
        <Text variant="headlineSmall">Enjoy buttons</Text>
        <Button buttonEmphasis={ButtonEmphasis.Primary}>One</Button>
        <Button buttonEmphasis={ButtonEmphasis.Secondary}>Two</Button>
        <Button buttonEmphasis={ButtonEmphasis.Tertiary}>Three</Button>
        <Button buttonEmphasis={ButtonEmphasis.Warning}>Warning</Button>
        <Button buttonEmphasis={ButtonEmphasis.Detrimental}>Danger</Button>
      </Stack>
    </Provider>
  )
}
