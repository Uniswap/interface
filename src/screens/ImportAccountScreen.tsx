import React from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { AccountStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { ImportReadonlyAccountForm } from 'src/features/import/ImportReadonlyAccountForm'
import { unlockWallet } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

export function ImportAccountScreen({ navigation }: AccountStackScreenProp<Screens.ImportAccount>) {
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
    <SheetScreen>
      <KeyboardAvoidingView style={flex.fill} behavior="padding">
        <Box px="lg" flex={1}>
          <Box flexDirection="row" alignItems="center" mb="lg">
            <BackButton size={30} mr="md" />
            <Text variant="bodyLg" color="black">
              {t('Track Account')}
            </Text>
          </Box>
          <Box flex={1} justifyContent="center">
            <ImportReadonlyAccountForm onImportSuccess={onImportSuccess} />
          </Box>
        </Box>
      </KeyboardAvoidingView>

      {/* <Box alignItems="center">
        <Text variant="h1" textAlign="center">
          {t('Import Your Account')}
        </Text>
        <PrimaryButton onPress={onPressScan} label={t('Scan a Seed Phrase')} mt="lg" />
        <ImportAccountForm onImportSuccess={onImportSuccess} />
      </Box> */}
    </SheetScreen>
  )
}
