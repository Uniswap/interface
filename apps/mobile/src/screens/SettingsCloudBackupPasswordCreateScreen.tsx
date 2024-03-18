import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { CloudBackupPasswordForm } from 'src/features/CloudBackup/CloudBackupPasswordForm'
import { Screens } from 'src/screens/Screens'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  Screens.SettingsCloudBackupPasswordCreate
>

// This screen is visited when no iCloud backup exists (checked from settings)
export function SettingsCloudBackupPasswordCreateScreen({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const [showCloudBackupInfoModal, setShowCloudBackupInfoModal] = useState(true)

  const navigateToNextScreen = ({ password }: { password: string }): void => {
    navigation.navigate({
      name: Screens.SettingsCloudBackupPasswordConfirm,
      params: {
        password,
        address,
      },
      merge: true,
    })
  }

  return (
    <Screen mx="$spacing16" my="$spacing16">
      <BackHeader mb="$spacing16" />
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
        <Flex alignItems="center" justifyContent="space-between" mb="$spacing24" mx="$spacing12">
          <Text variant="heading3">
            {t('settings.setting.backup.create.title', {
              cloudProviderName: getCloudProviderName(),
            })}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t('settings.setting.backup.create.description', {
              cloudProviderName: getCloudProviderName(),
            })}
          </Text>
        </Flex>
        <CloudBackupPasswordForm navigateToNextScreen={navigateToNextScreen} />
        {showCloudBackupInfoModal && (
          <BottomSheetModal
            backgroundColor={colors.surface2.get()}
            name={ModalName.CloudBackupInfo}>
            <Flex px="$spacing16" py="$spacing12">
              <Flex centered gap="$spacing16">
                <Flex backgroundColor="$accentSoft" borderRadius="$rounded12" p="$spacing12">
                  <Icons.OSDynamicCloudIcon color="$accent1" size="$icon.24" />
                </Flex>
                <Text textAlign="center" variant="subheading1">
                  {t('settings.setting.backup.modal.title', {
                    cloudProviderName: getCloudProviderName(),
                  })}
                </Text>
                <Text color="$neutral2" textAlign="center" variant="body2">
                  {t('settings.setting.backup.modal.description', {
                    cloudProviderName: getCloudProviderName(),
                  })}
                </Text>
              </Flex>
              <Flex centered row gap="$spacing12" pt="$spacing24">
                <Button fill theme="tertiary" onPress={(): void => navigation.goBack()}>
                  {t('common.button.cancel')}
                </Button>
                <Button
                  fill
                  testID={ElementName.Confirm}
                  onPress={(): void => setShowCloudBackupInfoModal(false)}>
                  {t('common.button.continue')}
                </Button>
              </Flex>
            </Flex>
          </BottomSheetModal>
        )}
      </ScrollView>
    </Screen>
  )
}
