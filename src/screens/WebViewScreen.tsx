import React from 'react'
import WebView from 'react-native-webview'
import { ExploreStackScreenProp, SettingsStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'

export function WebViewScreen({
  route,
}: SettingsStackScreenProp<Screens.WebView> | ExploreStackScreenProp<Screens.WebView>) {
  const { headerTitle, uriLink } = route.params
  return (
    <Screen edges={['top', 'left', 'right']}>
      <Flex alignItems="center" flexDirection="row" px="lg" py="md">
        <BackButton color="neutralTextSecondary" />
        <Text variant="largeLabel">{headerTitle}</Text>
      </Flex>
      <WebView
        source={{
          uri: uriLink,
        }}
      />
    </Screen>
  )
}
