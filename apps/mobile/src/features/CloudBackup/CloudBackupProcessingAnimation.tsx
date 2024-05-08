import { useFocusEffect } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList, SettingsStackParamList } from 'src/app/navigation/types'
import { backupMnemonicToCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { Flex, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { promiseMinDelay } from 'utilities/src/time/timing'
import { CheckmarkCircle } from 'wallet/src/components/icons/CheckmarkCircle'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useAccount } from 'wallet/src/features/wallet/hooks'

type Props = {
  accountAddress: Address
  password: string
  onBackupComplete: () => void
  onErrorPress: () => void
  navigation:
    | NativeStackNavigationProp<OnboardingStackParamList, OnboardingScreens.BackupCloudProcessing>
    | NativeStackNavigationProp<SettingsStackParamList, Screens.SettingsCloudBackupProcessing>
}

/** Screen to perform secure recovery phrase backup to Cloud  */
export function CloudBackupProcessingAnimation({
  accountAddress,
  onBackupComplete,
  onErrorPress,
  password,
  navigation,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const colors = useSporeColors()

  const account = useAccount(accountAddress)
  if (account.type !== AccountType.SignerMnemonic) {
    throw new Error('Account is not mnemonic account')
  }
  const mnemonicId = account?.mnemonicId

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
      await promiseMinDelay(backupMnemonicToCloudStorage(mnemonicId, password), ONE_SECOND_MS)

      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: accountAddress,
          backupMethod: BackupType.Cloud,
        })
      )
    } catch (error) {
      logger.error(error, {
        tags: { file: 'CloudBackupProcessingScreen', function: 'onPressNext' },
      })

      Alert.alert(
        t('settings.setting.backup.error.title', { cloudProviderName: getCloudProviderName() }),
        t('settings.setting.backup.error.message.full', {
          cloudProviderName: getCloudProviderName(),
        }),
        [
          {
            text: t('common.button.ok'),
            style: 'default',
            onPress: onErrorPress,
          },
        ]
      )
    }
  }, [accountAddress, dispatch, mnemonicId, onErrorPress, password, t])

  /**
   * Delays cloud backup to avoid android oauth consent screen blocking navigation transition
   */
  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('transitionEnd', async () => {
        await backup()
      })
    }, [backup, navigation])
  )

  const iconSize = iconSizes.icon40

  return processing ? (
    <Flex centered grow gap="$spacing24">
      <Flex centered height={iconSize} width={iconSize}>
        <ActivityIndicator size="large" />
      </Flex>
      <Text variant="heading3">
        {t('settings.setting.backup.status.inProgress', {
          cloudProviderName: getCloudProviderName(),
        })}
      </Text>
    </Flex>
  ) : (
    <Flex centered grow gap="$spacing24">
      <CheckmarkCircle
        borderColor="$statusSuccess"
        borderWidth={3}
        checkmarkStrokeWidth={2}
        color={colors.statusSuccess.val}
        size={iconSize}
      />
      <Text variant="heading3">
        {t('settings.setting.backup.status.complete', {
          cloudProviderName: getCloudProviderName(),
        })}
      </Text>
    </Flex>
  )
}
