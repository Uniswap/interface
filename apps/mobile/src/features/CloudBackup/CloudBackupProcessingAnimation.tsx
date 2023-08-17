import React, { useCallback, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { IS_ANDROID } from 'src/constants/globals'
import { backupMnemonicToCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { promiseMinDelay } from 'utilities/src/time/timing'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useAccount } from 'wallet/src/features/wallet/hooks'

type Props = {
  accountAddress: Address
  password: string
  onBackupComplete: () => void
  onErrorPress: () => void
}

/** Screen to perform secure recovery phrase backup to Cloud  */
export function CloudBackupProcessingAnimation({
  accountAddress,
  onBackupComplete,
  onErrorPress,
  password,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const account = useAccount(accountAddress)

  const [processing, doneProcessing] = useReducer(() => false, true)

  // Handle finished backing up to Cloud
  useEffect(() => {
    if (account?.backups?.includes(BackupType.Cloud)) {
      doneProcessing()
      // Show success state for 1s before navigating
      const timer = setTimeout(onBackupComplete, ONE_SECOND_MS)
      return () => clearTimeout(timer)
    }
  }, [account?.backups, onBackupComplete])

  // Handle backup to Cloud when screen appears
  const backup = useCallback(async () => {
    try {
      // Ensure processing state is shown for at least 1s
      await promiseMinDelay(backupMnemonicToCloudStorage(accountAddress, password), ONE_SECOND_MS)

      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: accountAddress,
          backupMethod: BackupType.Cloud,
        })
      )
    } catch (error) {
      logger.error('Unable to backup to cloud storage', {
        tags: {
          file: 'CloudBackupProcessingScreen',
          function: 'onPressNext',
          error: serializeError(error),
        },
      })

      Alert.alert(
        IS_ANDROID ? t('Google Drive error') : t('iCloud error'),
        IS_ANDROID
          ? t(
              'Unable to backup recovery phrase to Google Drive. Please ensure you have Google Drive enabled with available storage space and try again.'
            )
          : t(
              'Unable to backup recovery phrase to iCloud. Please ensure you have iCloud enabled with available storage space and try again.'
            ),
        [
          {
            text: t('OK'),
            style: 'default',
            onPress: onErrorPress,
          },
        ]
      )
    }
  }, [accountAddress, dispatch, onErrorPress, password, t])

  useAsyncData(backup)

  return processing ? (
    <Flex centered grow gap="spacing24">
      <ActivityIndicator size="large" />
      <Text variant="headlineSmall">
        {IS_ANDROID ? t('Backing up to Google Drive...') : t('Backing up to iCloud...')}
      </Text>
    </Flex>
  ) : (
    <Flex centered grow gap="spacing24">
      <CheckmarkCircle
        borderColor="statusSuccess"
        borderWidth={3}
        checkmarkStrokeWidth={2}
        color={theme.colors.statusSuccess}
        size={theme.iconSizes.icon40}
      />
      <Text variant="headlineSmall">
        {IS_ANDROID ? t('Backed up to Google Drive') : t('Backed up to iCloud')}
      </Text>
    </Flex>
  )
}
