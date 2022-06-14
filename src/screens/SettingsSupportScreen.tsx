import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { SettingsBackButtonRow } from 'src/components/Settings/BackButtonRow'
import { Text } from 'src/components/Text'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'
import { getLogBuffer } from 'src/utils/logger'

export function SettingsSupportScreen() {
  const { t } = useTranslation()

  const recentLogs = getLogBuffer().reverse()

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={{ ...flex.fill, paddingTop: theme.spacing.xxl }}>
        <SettingsBackButtonRow>
          <Text variant="largeLabel">{t('Wallet Support')}</Text>
        </SettingsBackButtonRow>
        <Text mb="sm" variant="subHead1">
          {t('Recent logs')}
        </Text>
        <ScrollView>
          <Text mt="md" variant="badge">
            {recentLogs.join('\n\n')}
          </Text>
        </ScrollView>
      </ScrollView>
    </SheetScreen>
  )
}
