import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { flex } from 'src/styles/flex'
import { getLogBuffer } from 'src/utils/logger'

export function SettingsSupportScreen() {
  const { t } = useTranslation()

  const recentLogs = getLogBuffer().reverse()

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={flex.fill}>
        <Box alignItems="center" flexDirection="row" mb="lg">
          <BackButton mr="md" />
          <Text variant="bodyLg">{t('Wallet Support')}</Text>
        </Box>
        <Text mb="sm" variant="bodyLg">
          {t('Recent logs')}
        </Text>
        <ScrollView>
          <Text mt="md" variant="bodyXs">
            {recentLogs.join('\n\n')}
          </Text>
        </ScrollView>
      </ScrollView>
    </SheetScreen>
  )
}
