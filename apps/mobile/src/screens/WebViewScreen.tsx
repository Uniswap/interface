import React from 'react'
import WebView from 'react-native-webview'
import { AppStackScreenProp, SettingsStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'
import { Separator, Text } from 'ui/src'

export function WebViewScreen({
  route,
}: SettingsStackScreenProp<Screens.WebView> | AppStackScreenProp<Screens.WebView>): JSX.Element {
  const { headerTitle, uriLink } = route.params

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <BackHeader alignment="center" mb="$spacing16" pt="$spacing4" px="$spacing12">
        <Text variant="body1">{headerTitle}</Text>
      </BackHeader>
      <Separator />
      <WebView
        source={{
          uri: uriLink,
        }}
      />
    </Screen>
  )
}
