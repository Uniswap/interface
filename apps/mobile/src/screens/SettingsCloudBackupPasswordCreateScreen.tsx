import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { SafeKeyboardScreen } from 'src/components/layout/SafeKeyboardScreen'
import { CloudBackupPassword } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPassword'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { OSDynamicCloudIcon } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsCloudBackupPasswordCreate>

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

  const navigateToNextScreen = useCallback(
    ({ password }: { password: string }): void => {
      navigation.navigate({
        name: MobileScreens.SettingsCloudBackupPasswordConfirm,
        params: {
          password,
          address,
        },
        merge: true,
      })
    },
    [navigation, address],
  )

  return (
    <CloudBackupPassword.FormProvider navigateToNextScreen={navigateToNextScreen}>
      <SafeKeyboardScreen
        footer={
          <Flex mx="$spacing16" my="$spacing12">
            <CloudBackupPassword.ContinueButton />
          </Flex>
        }
        header={<BackHeader mx="$spacing16" my="$spacing16" />}
      >
        <Flex gap="$spacing12" mb="$spacing24" mx="$spacing12">
          <Text textAlign="center" variant="heading3">
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
        <CloudBackupPassword.PasswordInput />
        {showCloudBackupInfoModal && (
          <Modal backgroundColor={colors.surface2.val} name={ModalName.CloudBackupInfo}>
            <Flex px="$spacing16" py="$spacing12">
              <Flex centered gap="$spacing16">
                <Flex backgroundColor="$DEP_accentSoft" borderRadius="$rounded12" p="$spacing12">
                  <OSDynamicCloudIcon color="$accent1" size="$icon.24" />
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
                <Flex row fill>
                  <Button emphasis="secondary" size="large" onPress={(): void => navigation.goBack()}>
                    {t('common.button.cancel')}
                  </Button>
                </Flex>
                <Flex row fill>
                  <Button variant="branded" size="large" onPress={(): void => setShowCloudBackupInfoModal(false)}>
                    {t('common.button.continue')}
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Modal>
        )}
      </SafeKeyboardScreen>
    </CloudBackupPassword.FormProvider>
  )
}
