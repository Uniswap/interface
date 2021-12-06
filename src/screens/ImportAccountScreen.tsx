import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { HomeStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ImportReadonlyAccountForm } from 'src/features/import/ImportReadonlyAccountForm'
import { unlockWallet } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.ImportAccount>

export function ImportAccountScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const onImportSuccess = () => {
    dispatch(unlockWallet())
    navigation.navigate(Screens.Accounts)
  }
  // const onPressScan = () => {
  //   navigation.navigate(Screens.Camera)
  // }

  const { t } = useTranslation()

  return (
    <Screen>
      <BackButton ml={'sm'} size={30} />
      <Box alignItems="center" mb="lg">
        <Text variant="h1" textAlign="center">
          {t`Track any wallet`}
        </Text>
        <ImportReadonlyAccountForm onImportSuccess={onImportSuccess} />
      </Box>
      {/* <Box alignItems="center">
        <Text variant="h1" textAlign="center">
          {t('Import Your Account')}
        </Text>
        <PrimaryButton onPress={onPressScan} label={t('Scan a Seed Phrase')} mt="lg" />
        <ImportAccountForm onImportSuccess={onImportSuccess} />
      </Box> */}
    </Screen>
  )
}
