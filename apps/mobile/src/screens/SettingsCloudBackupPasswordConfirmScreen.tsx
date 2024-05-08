import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { CloudBackupPasswordForm } from 'src/features/CloudBackup/CloudBackupPasswordForm'
import { Screens } from 'src/screens/Screens'
import { Flex, Text } from 'ui/src'

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  Screens.SettingsCloudBackupPasswordConfirm
>

export function SettingsCloudBackupPasswordConfirmScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { password } = params

  const navigateToNextScreen = (): void => {
    navigation.navigate({
      name: Screens.SettingsCloudBackupProcessing,
      params,
      merge: true,
    })
  }

  return (
    <Screen mx="$spacing16" my="$spacing16">
      <BackHeader mb="$spacing16" />
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
        <Flex alignItems="center" justifyContent="space-between" mb="$spacing24" mx="$spacing12">
          <Text textAlign="center" variant="heading3">
            {t('onboarding.cloud.confirm.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t('onboarding.cloud.confirm.description')}
          </Text>
        </Flex>
        <CloudBackupPasswordForm
          isConfirmation={true}
          navigateToNextScreen={navigateToNextScreen}
          passwordToConfirm={password}
        />
      </ScrollView>
    </Screen>
  )
}
