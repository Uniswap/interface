import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { BackButtonRow } from 'src/components/layout/BackButtonRow'
import { SheetScreen } from 'src/components/layout/SheetScreen'
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
        <BackButtonRow>
          <Text variant="subhead">{t('Wallet Support')}</Text>
        </BackButtonRow>
        <Text mb="sm" variant="subhead">
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
