import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { SafeKeyboardScreen } from 'src/components/layout/SafeKeyboardScreen'
import { CloudBackupPassword } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPassword'
import { Flex, Text } from 'ui/src'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsCloudBackupPasswordConfirm>

export function SettingsCloudBackupPasswordConfirmScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { password } = params

  const navigateToNextScreen = useCallback((): void => {
    navigation.navigate({
      name: MobileScreens.SettingsCloudBackupProcessing,
      params,
      merge: true,
    })
  }, [navigation, params])

  return (
    <CloudBackupPassword.FormProvider
      isConfirmation={true}
      checkPasswordBeforeSubmit={true}
      navigateToNextScreen={navigateToNextScreen}
      passwordToConfirm={password}
    >
      <SafeKeyboardScreen
        footer={
          <Flex mx="$spacing16" my="$spacing12">
            <CloudBackupPassword.ContinueButton />
          </Flex>
        }
        header={<BackHeader mx="$spacing16" my="$spacing16" />}
      >
        <Flex alignItems="center" gap="$spacing12" justifyContent="space-between" mb="$spacing24" mx="$spacing12">
          <Text textAlign="center" variant="heading3">
            {t('onboarding.cloud.confirm.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t('onboarding.cloud.confirm.description')}
          </Text>
        </Flex>
        <CloudBackupPassword.PasswordInput />
      </SafeKeyboardScreen>
    </CloudBackupPassword.FormProvider>
  )
}
