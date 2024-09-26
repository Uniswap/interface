import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useDispatch } from 'react-redux'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { deleteCloudStorageMnemonicBackup } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import Checkmark from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { logger } from 'utilities/src/logger/logger'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsCloudBackupStatus>

export function SettingsCloudBackupStatus({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const accounts = useAccounts()
  const mnemonicId = (accounts[address] as SignerMnemonicAccount)?.mnemonicId
  const backups = useCloudBackups(mnemonicId)
  const associatedAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === mnemonicId,
  )

  const [showBackupDeleteWarning, setShowBackupDeleteWarning] = useState(false)
  const onConfirmDeleteBackup = async (): Promise<void> => {
    if (requiredForTransactions) {
      await biometricTrigger()
    } else {
      await deleteBackup()
    }
  }

  const deleteBackup = async (): Promise<void> => {
    try {
      await deleteCloudStorageMnemonicBackup(mnemonicId)
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.RemoveBackupMethod,
          address,
          backupMethod: BackupType.Cloud,
        }),
      )
      setShowBackupDeleteWarning(false)
      navigation.navigate(MobileScreens.Settings)
    } catch (error) {
      setShowBackupDeleteWarning(false)
      logger.error(error, { tags: { file: 'SettingsCloudBackupStatus', function: 'deleteBackup' } })

      Alert.alert(
        t('settings.setting.backup.error.title', { cloudProviderName: getCloudProviderName() }),
        t('settings.setting.backup.error.message.short'),
        [{ text: t('common.button.ok'), style: 'default' }],
      )
    }
  }

  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(deleteBackup)

  const onPressBack = (): void => {
    navigation.navigate(MobileScreens.Settings)
  }

  const googleDriveEmail = backups[0]?.googleDriveEmail

  return (
    <Screen mx="$spacing16" my="$spacing16">
      <BackHeader alignment="center" mb="$spacing16" onPressBack={onPressBack}>
        <Text variant="body1">
          {t('settings.setting.backup.status.title', { cloudProviderName: getCloudProviderName() })}
        </Text>
      </BackHeader>

      <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="$spacing16" mx="$spacing8">
        <Flex grow gap="$spacing24" justifyContent="flex-start">
          <Text color="$neutral2" variant="body2">
            {t('settings.setting.backup.status.description', {
              cloudProviderName: getCloudProviderName(),
            })}
          </Text>
          <Flex row justifyContent="space-between">
            <Text flexShrink={1} variant="body1">
              {t('settings.setting.backup.recoveryPhrase.label')}
            </Text>
            <Flex alignItems="flex-end" flexGrow={1} gap="$spacing4">
              <Flex row alignItems="center" gap="$spacing12" justifyContent="space-around">
                <Text color="$neutral2" variant="buttonLabel3">
                  {t('settings.setting.backup.status.recoveryPhrase.backed')}
                </Text>

                {/* @TODO: [MOB-249] Add non-backed up state once we have more options on this page  */}
                <Checkmark color={colors.statusSuccess.val} height={iconSizes.icon24} width={iconSizes.icon24} />
              </Flex>
              {googleDriveEmail && (
                <Text color="$neutral3" variant="buttonLabel3">
                  {googleDriveEmail}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Button
          testID={TestID.Remove}
          theme="detrimental"
          onPress={(): void => {
            setShowBackupDeleteWarning(true)
          }}
        >
          {t('settings.setting.backup.status.action.delete')}
        </Button>
      </Flex>

      <WarningModal
        caption={t('settings.setting.backup.delete.warning', {
          cloudProviderName: getCloudProviderName(),
        })}
        closeText={t('common.button.close')}
        confirmText={t('common.button.delete')}
        isOpen={showBackupDeleteWarning}
        modalName={ModalName.ViewSeedPhraseWarning}
        title={t('settings.setting.backup.delete.confirm.title')}
        onClose={(): void => {
          setShowBackupDeleteWarning(false)
        }}
        onConfirm={onConfirmDeleteBackup}
      >
        {associatedAccounts.length > 1 && (
          <Flex>
            <Text textAlign="left" variant="subheading2">
              {t('settings.setting.backup.delete.confirm.message')}
            </Text>
            <Flex>
              {associatedAccounts.map((account) => (
                <AddressDisplay address={account.address} size={36} variant="subheading1" />
              ))}
            </Flex>
          </Flex>
        )}
      </WarningModal>
    </Screen>
  )
}
