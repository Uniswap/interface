import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { createAccountActions } from 'src/features/wallet/createAccount'
import { unlockWallet } from 'src/features/wallet/walletSlice'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Welcome>

export function WelcomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()

  const onClickCreate = () => {
    dispatch(createAccountActions.trigger())
    dispatch(unlockWallet())
  }

  const onClickImport = () => {
    navigation.navigate(Screens.ImportAccount)
  }

  const { t } = useTranslation()
  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h1" textAlign="center">
          {t('Uniswap Wallet')}
        </Text>
        <PrimaryButton label={t('Create New Account')} onPress={onClickCreate} mt="lg" />
        <PrimaryButton label={t('Import Account')} onPress={onClickImport} mt="lg" />
      </Box>
    </Screen>
  )
}
