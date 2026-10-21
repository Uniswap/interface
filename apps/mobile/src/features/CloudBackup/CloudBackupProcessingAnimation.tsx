import { useFocusEffect } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Flex, iconSizes, Text } from '@universe/mycelium'
import React, { useCallback, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert } from 'react-native'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList, SettingsStackParamList } from 'src/app/navigation/types'
import {
  backupMnemonicToCloudStorage,
  getCloudBackupErrorCode,
} from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { CloudBackupErrorCode } from 'src/features/CloudBackup/types'
import { CheckmarkCircle } from 'ui/src/components/icons'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { AppTFunction } from 'utilities/src/i18n/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { promiseMinDelay } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccount } from 'wallet/src/features/wallet/hooks'

/**
 * A failed upload and an upload that merely could not be confirmed need different advice: the first
 * is only fixed by freeing up space, the second usually resolves itself once the device is back
 * online.
 */
function getBackupErrorMessage(error: unknown, t: AppTFunction): string {
  const cloudProviderName = getCloudProviderName()

  switch (getCloudBackupErrorCode(error)) {
    case CloudBackupErrorCode.QuotaExceeded:
      return t('settings.setting.backup.error.message.storageFull', { cloudProviderName })
    case CloudBackupErrorCode.UploadNotConfirmed:
      return t('settings.setting.backup.error.message.unconfirmed', { cloudProviderName })
    default:
      return t('settings.setting.backup.error.message.full', { cloudProviderName })
  }
}

type Props = {
  accountAddress: Address
  password: string
  onBackupComplete: () => void
  onErrorPress: () => void
  navigation:
    | NativeStackNavigationProp<OnboardingStackParamList, OnboardingScreens.BackupCloudProcessing>
    | NativeStackNavigationProp<SettingsStackParamList, MobileScreens.SettingsCloudBackupProcessing>
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
  const dispatch = useDispatch()
  const { addBackupMethod, getOnboardingOrImportedAccount } = useOnboardingContext()
  const onboardingContextAccount = getOnboardingOrImportedAccount()
  const activeAccount = useSignerAccount(accountAddress)

  const account = activeAccount || onboardingContextAccount

  if (!account) {
    throw Error('No account available for backup')
  }

  const mnemonicId = account.mnemonicId

  const [processing, doneProcessing] = useReducer(() => false, true)

  useFocusEffect(
    useCallback(() => {
      if (processing) {
        return undefined
      }
      const timer = setTimeout(onBackupComplete, ONE_SECOND_MS)
      return () => clearTimeout(timer)
    }, [onBackupComplete, processing]),
  )

  // Handle backup to Cloud when screen appears
  const backup = useCallback(async () => {
    try {
      // Ensure processing state is shown for at least 1s
      await promiseMinDelay(backupMnemonicToCloudStorage(mnemonicId, password), ONE_SECOND_MS)
      if (activeAccount) {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.AddBackupMethod,
            address: accountAddress,
            backupMethod: BackupType.Cloud,
          }),
        )
      } else {
        addBackupMethod(BackupType.Cloud)
      }
      // The account's backup flag may belong to an earlier attempt with a different password.
      doneProcessing()
    } catch (error) {
      logger.error(error, {
        tags: { file: 'CloudBackupProcessingScreen', function: 'onPressNext' },
      })

      // Confirmation can take up to 30s, long enough for the user to leave; the alert and its
      // navigation would then act on a screen that is gone. Success is still recorded above.
      if (!navigation.isFocused()) {
        return
      }

      Alert.alert(
        t('settings.setting.backup.error.title', { cloudProviderName: getCloudProviderName() }),
        getBackupErrorMessage(error, t),
        [
          {
            text: t('common.button.ok'),
            style: 'default',
            onPress: onErrorPress,
          },
        ],
      )
    }
  }, [accountAddress, activeAccount, addBackupMethod, dispatch, mnemonicId, navigation, onErrorPress, password, t])

  /**
   * Delays cloud backup to avoid android oauth consent screen blocking navigation transition
   */
  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('transitionEnd', async () => {
        await backup()
      })
    }, [backup, navigation]),
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
      <CheckmarkCircle size={iconSize} />
      <Text variant="heading3">
        {t('settings.setting.backup.status.complete', {
          cloudProviderName: getCloudProviderName(),
        })}
      </Text>
    </Flex>
  )
}
