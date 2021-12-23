import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import {
  SettingsStackNavigationProp,
  SettingsStackParamList,
  useSettingsStackNavigation,
} from 'src/app/navigation/types'
import { AccountCard } from 'src/components/accounts/AccountCard'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

export function SettingsScreen() {
  const navigation = useSettingsStackNavigation()
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()

  return (
    <Screen>
      <ScrollView contentContainerStyle={flex.fill}>
        <Box px="lg">
          <Box flexDirection="row" alignItems="center" mb="lg">
            <BackButton size={30} mr="md" />
            <Text variant="bodyLg">{t('Settings')}</Text>
          </Box>
          {activeAccount && <AccountCard account={activeAccount} />}
          <SettingsRow text={t('Chains')} screen={Screens.SettingsChains} navigation={navigation} />
          <SettingsRow text={t('Dev Options')} screen={Screens.Dev} navigation={navigation} />
        </Box>
      </ScrollView>
    </Screen>
  )
}

interface SettingsRowProps {
  icon?: ReactElement
  text: string
  screen: keyof SettingsStackParamList
  navigation: SettingsStackNavigationProp
}

function SettingsRow({ icon, text, screen, navigation }: SettingsRowProps) {
  return (
    <Button onPress={() => navigation.navigate(screen)} mt="lg">
      <Box flexDirection="row">
        {icon}
        <Text ml="md">{text}</Text>
      </Box>
    </Button>
  )
}
