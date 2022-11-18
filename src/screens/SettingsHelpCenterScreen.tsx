import React from 'react'
import { useTranslation } from 'react-i18next'
import WebView from 'react-native-webview'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { uniswapUrls } from 'src/constants/urls'

export function SettingsHelpCenterScreen() {
  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center" flexDirection="row" mb="lg" mx="lg">
        <BackButton mr="md" />
        <Text variant="bodyLarge">{t('Help Center')}</Text>
      </Box>
      <WebView source={{ uri: uniswapUrls.helpUrl }} />
    </Screen>
  )
}
