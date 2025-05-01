import { useFocusEffect } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert } from 'react-native'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList, SettingsStackParamList } from 'src/app/navigation/types'
import { backupMnemonicToCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { Flex, Text } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { promiseMinDelay } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useSignerAccount } from 'wallet/src/features/wallet/hooks'

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

  if (account.type !== AccountType.SignerMnemonic) {
    throw new Error(`Backed up account with address: ${account.address} is not a mnemonic account`)
  }
  const mnemonicId = account?.mnemonicId

  const [processing, doneProcessing] = useReducer(() => false, true)

  // Handle finished backing up to Cloud
  useEffect(() => {
    if (hasBackup(BackupType.Cloud, account)) {
      doneProcessing()
      // Show success state for 1s before navigating
      const timer = setTimeout(onBackupComplete, ONE_SECOND_MS)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [account, onBackupComplete])

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
        ],
      )
    }
  }, [accountAddress, activeAccount, addBackupMethod, dispatch, mnemonicId, onErrorPress, password, t])

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
