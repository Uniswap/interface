import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { Text } from 'src/components/Text'
import { SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { useAccounts } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsViewSeedPhrase>

export function SettingsViewSeedPhraseScreen({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()

  const accounts = useAccounts()
  const account = accounts[address]
  const mnemonicId = (account as SignerMnemonicAccount)?.mnemonicId

  const navigateBack = (): void => {
    navigation.goBack()
  }

  return (
    <Screen mx="spacing16" my="spacing24">
      <BackHeader alignment="center">
        <Text variant="bodyLarge">{t('Recovery phrase')}</Text>
      </BackHeader>
      <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={navigateBack} />
    </Screen>
  )
}
