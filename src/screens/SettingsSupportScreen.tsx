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
    <SheetScreen>
      <ScrollView contentContainerStyle={flex.fill}>
        <Box px="lg">
          <Box flexDirection="row" alignItems="center" mb="lg">
            <BackButton size={30} mr="md" />
            <Text variant="bodyLg">{t('Wallet Support')}</Text>
          </Box>
          <Text variant="bodyLg" mb="sm">
            {t('Recent logs')}
          </Text>
          <ScrollView>
            <Text variant="bodyXs" mt="md">
              {recentLogs.join('\n\n')}
            </Text>
          </ScrollView>
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
