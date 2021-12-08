import { useNavigation } from '@react-navigation/core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { unlockWallet } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'

export function WelcomeScreen() {
  const dispatch = useAppDispatch()
  const navigation = useNavigation<any>()

  const onPressCreate = () => {
    dispatch(createAccountActions.trigger())
    dispatch(unlockWallet())
  }

  const onPressImport = () => {
    navigation.navigate(Screens.ImportAccount)
  }

  const { t } = useTranslation()
  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h1" textAlign="center">
          {t('Uniswap Wallet')}
        </Text>
        <PrimaryButton label={t('Create New Account')} onPress={onPressCreate} mt="lg" />
        <PrimaryButton
          label={t('Import Account')}
          onPress={onPressImport}
          mt="lg"
          testID="import-account-button"
        />
      </Box>
    </Screen>
  )
}
