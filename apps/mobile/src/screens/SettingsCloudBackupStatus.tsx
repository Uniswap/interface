import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { IS_ANDROID } from 'src/constants/globals'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { deleteCloudStorageMnemonicBackup } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import Checkmark from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import {
  AccountType,
  BackupType,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsCloudBackupStatus>

export function SettingsCloudBackupStatus({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const accounts = useAccounts()
  const mnemonicId = (accounts[address] as SignerMnemonicAccount)?.mnemonicId
  const backups = useCloudBackups(mnemonicId)
  const associatedAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === mnemonicId
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
        })
      )
      setShowBackupDeleteWarning(false)
      navigation.navigate(Screens.SettingsWallet, { address })
    } catch (error) {
      setShowBackupDeleteWarning(false)
      logger.error(error, { tags: { file: 'SettingsCloudBackupStatus', function: 'deleteBackup' } })

      Alert.alert(
        IS_ANDROID ? t('Google Drive error') : t('iCloud error'),
        t('Unable to delete backup'),
        [{ text: t('OK'), style: 'default' }]
      )
    }
  }

  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(deleteBackup)

  const onPressBack = (): void => {
    navigation.navigate(Screens.SettingsWallet, { address })
  }

  const googleDriveEmail = backups[0]?.googleDriveEmail

  return (
    <Screen mx="$spacing16" my="$spacing16">
      <BackHeader alignment="center" mb="$spacing16" onPressBack={onPressBack}>
        <Text variant="body1">{IS_ANDROID ? t('Google Drive backup') : t('iCloud backup')}</Text>
      </BackHeader>

      <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="$spacing16" mx="$spacing8">
        <Flex grow gap="$spacing24" justifyContent="flex-start">
          <Text color="$neutral2" variant="body2">
            {IS_ANDROID
              ? t(
                  'By having your recovery phrase backed up to Google Drive, you can recover your wallet just by being logged into your Google account on any device.'
                )
              : t(
                  'By having your recovery phrase backed up to iCloud, you can recover your wallet just by being logged into your iCloud on any device.'
                )}
          </Text>
          <Flex row justifyContent="space-between">
            <Text flexShrink={1} variant="body1">
              {t('Recovery phrase')}
            </Text>
            <Flex alignItems="flex-end" flexGrow={1} gap="$spacing4">
              <Flex row alignItems="center" gap="$spacing12" justifyContent="space-around">
                <Text color="$neutral2" variant="buttonLabel4">
                  {t('Backed up')}
                </Text>

                {/* @TODO: [MOB-249] Add non-backed up state once we have more options on this page  */}
                <Checkmark
                  color={colors.statusSuccess.val}
                  height={iconSizes.icon24}
                  width={iconSizes.icon24}
                />
              </Flex>
              {googleDriveEmail && (
                <Text color="$neutral3" variant="buttonLabel4">
                  {googleDriveEmail}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Button
          testID={ElementName.Remove}
          theme="detrimental"
          onPress={(): void => {
            setShowBackupDeleteWarning(true)
          }}>
          {IS_ANDROID ? t('Delete backup') : t('Delete backup')}
        </Button>
      </Flex>

      {showBackupDeleteWarning && (
        <WarningModal
          caption={
            IS_ANDROID
              ? t(
                  'If you delete your Google Drive backup, you’ll only be able to recover your wallet with a manual backup of your recovery phrase. Uniswap Labs can’t recover your assets if you lose your recovery phrase.'
                )
              : t(
                  'If you delete your iCloud backup, you’ll only be able to recover your wallet with a manual backup of your recovery phrase. Uniswap Labs can’t recover your assets if you lose your recovery phrase.'
                )
          }
          closeText={t('Close')}
          confirmText={t('Delete')}
          modalName={ModalName.ViewSeedPhraseWarning}
          title={t('Are you sure?')}
          onClose={(): void => {
            setShowBackupDeleteWarning(false)
          }}
          onConfirm={onConfirmDeleteBackup}>
          {associatedAccounts.length > 1 && (
            <Flex>
              <Text textAlign="left" variant="subheading2">
                {t(
                  'Because these wallets share a recovery phrase, it will also delete the backups for:'
                )}
              </Text>
              <Flex>
                {associatedAccounts.map((account) => (
                  <AddressDisplay address={account.address} size={36} variant="subheading1" />
                ))}
              </Flex>
            </Flex>
          )}
        </WarningModal>
      )}
    </Screen>
  )
}
