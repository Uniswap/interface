import React from 'react'
import WebView from 'react-native-webview'
import { SettingsStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'

export function SettingsWebviewOptionScreen({
  route,
}: SettingsStackScreenProp<Screens.SettingsWebviewOption>) {
  const { headerTitle, uriLink } = route.params
  return (
    <Screen>
      <Flex alignItems="center" flexDirection="row" p="lg">
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
