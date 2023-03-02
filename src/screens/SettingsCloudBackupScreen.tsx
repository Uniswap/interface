import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ScrollView } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { backupMnemonicToICloud } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { CloudBackupSetPassword } from 'src/features/onboarding/CloudBackupSetPassword'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { BackupType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsCloudBackupScreen>

// This screen is visited when no iCloud backup exists (checked from settings)
export function SettingsCloudBackupScreen({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const [showCloudBackupInfoModal, setShowCloudBackupInfoModal] = useState(true)

  const accounts = useAccounts()
  const accountBackups = accounts[address]?.backups

  const onPressNext = async (password: string): Promise<void> => {
    try {
      const mnemonicId = (accounts[address] as SignerMnemonicAccount)?.mnemonicId
      if (!mnemonicId) return

      await backupMnemonicToICloud(mnemonicId, password)
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address,
          backupMethod: BackupType.Cloud,
        })
      )
    } catch (error) {
      logger.error('SettingsCloudBackupScreen', 'onPressNext', `${error}`)
      Alert.alert(
        t('iCloud error'),
        t(
          'Unable to backup recovery phrase to iCloud. Please ensure you have iCloud enabled with available storage space and try again.'
        ),
        [
          {
            text: t('OK'),
            style: 'default',
          },
        ]
      )
      navigation.goBack()
    }
  }

  useEffect(() => {
    if (accountBackups?.includes(BackupType.Cloud)) {
      navigation.replace(Screens.SettingsCloudBackupStatus, { address })
    }
  }, [accountBackups, address, navigation])

  return (
    <Screen mx="spacing16" my="spacing16">
      <BackHeader mb="spacing16" />
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
        <Flex alignItems="center" justifyContent="space-between" mb="spacing24" mx="spacing12">
          <Text variant="headlineSmall">{t('Back up to iCloud')}</Text>
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {t(
              'Setting a password will encrypt your recovery phrase backup, adding an extra level of protection if your iCloud account is ever compromised.'
            )}
          </Text>
        </Flex>
        <CloudBackupSetPassword
          doneButtonText={t('Back up to iCloud')}
          focusPassword={!showCloudBackupInfoModal}
          onPressDone={onPressNext}
        />
        {showCloudBackupInfoModal && (
          <BottomSheetModal
            backgroundColor={theme.colors.background1}
            name={ModalName.ICloudBackupInfo}>
            <Flex gap="none" mb="spacing36" px="spacing16" py="spacing12">
              <Flex centered gap="spacing16">
                <Box
                  borderColor="accentAction"
                  borderRadius="rounded12"
                  borderWidth={1}
                  padding="spacing12">
                  <CloudIcon color={theme.colors.accentAction} />
                </Box>
                <Text textAlign="center" variant="buttonLabelMedium">
                  {t('Back up recovery phrase to iCloud?')}
                </Text>
                <Text color="textSecondary" textAlign="center" variant="bodySmall">
                  {t(
                    'It looks like you haven’t backed up your recovery phrase to iCloud yet. By doing so, you can recover your wallet just by being logged into iCloud on any device.'
                  )}
                </Text>
              </Flex>
              <Flex centered row gap="spacing12" pt="spacing24">
                <Button
                  fill
                  emphasis={ButtonEmphasis.Tertiary}
                  label={t('Cancel')}
                  onPress={(): void => navigation.goBack()}
                />
                <Button
                  fill
                  label={t('Back up')}
                  name={ElementName.Confirm}
                  onPress={(): void => setShowCloudBackupInfoModal(false)}
                />
              </Flex>
            </Flex>
          </BottomSheetModal>
        )}
      </ScrollView>
    </Screen>
  )
}
