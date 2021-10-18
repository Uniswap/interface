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
import { ImportAccountForm } from 'src/features/import/importAccountForm'
import { unlockWallet } from 'src/features/wallet/walletSlice'

type Props = NativeStackScreenProps<RootStackParamList, Screens.ImportAccount>

export function ImportAccountScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const onImportSuccess = () => {
    dispatch(unlockWallet())
  }
  const onPressScan = () => {
    navigation.navigate(Screens.Camera)
  }

  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h1" textAlign="center">
          {t('Import Your Account')}
        </Text>
        <PrimaryButton onPress={onPressScan} label={t('Scan a Seed Phrase')} mt="lg" />
        <ImportAccountForm onImportSuccess={onImportSuccess} />
      </Box>
    </Screen>
  )
}
