import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { Text } from 'ui/src'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useAccounts, useActiveSignerAccount } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsViewSeedPhrase>

export function SettingsViewSeedPhraseScreen({ navigation, route }: Props): JSX.Element {
  const { t } = useTranslation()
  const { address: addressParam, walletNeedsRestore } = route.params ?? {}
  // Use provided address or fall back to active signer account
  const activeSignerAccount = useActiveSignerAccount()
  const address = addressParam ?? activeSignerAccount?.address

  const accounts = useAccounts()
  const account = address ? accounts[address] : undefined
  const mnemonicId = account?.type === AccountType.SignerMnemonic ? account.mnemonicId : undefined

  const navigateBack = (): void => {
    navigation.goBack()
  }

  if (!mnemonicId) {
    logger.warn(
      'SettingsViewSeedPhraseScreen',
      'SettingsViewSeedPhraseScreen',
      'Found missing mnemonicId while trying to view seed phrase',
    )
  }

  return (
    <Screen mb="$spacing12" mt="$spacing24">
      <BackHeader alignment="center" px="$spacing16">
        <Text variant="body1">{t('settings.setting.recoveryPhrase.title')}</Text>
      </BackHeader>
      <SeedPhraseDisplay
        mnemonicId={mnemonicId ?? ''}
        walletNeedsRestore={walletNeedsRestore}
        onDismiss={navigateBack}
      />
    </Screen>
  )
}
