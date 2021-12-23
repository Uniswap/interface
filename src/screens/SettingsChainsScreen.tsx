import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { useActiveChainIds } from 'src/features/chains/utils'
import { flex } from 'src/styles/flex'

export function SettingsChainsScreen() {
  const { t } = useTranslation()

  const chains = useActiveChainIds()

  return (
    <Screen>
      <ScrollView contentContainerStyle={flex.fill}>
        <Box px="lg">
          <Box flexDirection="row" alignItems="center" mb="lg">
            <BackButton size={30} mr="md" />
            <Text variant="bodyLg">{t('Chain Settings')}</Text>
          </Box>
          <Text>{chains.join(',')}</Text>
        </Box>
      </ScrollView>
    </Screen>
  )
}
