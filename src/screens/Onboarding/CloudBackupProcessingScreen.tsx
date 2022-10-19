import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { backupMnemonicToICloud } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { BackupType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudProcessing
>

/** Screen to perform secure recovery phrase backup to Cloud  */
export function CloudBackupProcessingScreen({
  navigation,
  route: {
    params: { password, importType },
  },
}: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const [processing, doneProcessing] = useReducer(() => false, true)

  const handleBackupError = useCallback(() => {
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
    navigation.navigate({
      name: OnboardingScreens.Backup,
      params: { importType },
      merge: true,
    })
  }, [t, importType, navigation])

  // Handle finished backing up to Cloud
  useEffect(() => {
    if (activeAccount?.backups?.includes(BackupType.Cloud)) {
      doneProcessing()
      navigation.navigate({
        name: OnboardingScreens.Backup,
        params: { importType },
        merge: true,
      })
    }
  }, [activeAccount?.backups, importType, navigation])

  // Handle backup to Cloud when screen appears
  useEffect(() => {
    if (!activeAccount?.address) return

    const backup = async () => {
      try {
        await backupMnemonicToICloud(activeAccount.address, password)
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.AddBackupMethod,
            address: activeAccount.address,
            backupMethod: BackupType.Cloud,
          })
        )
      } catch (error) {
        logger.debug('CloudBackupProcessingScreen', 'backupMnemonicToICloud', 'Error', error)
        handleBackupError()
      }
    }

    backup()
  }, [activeAccount?.address, dispatch, handleBackupError, password])

  return (
    <Screen>
      {processing ? (
        <Flex centered grow gap="xl">
          <ActivityIndicator size="large" />
          <Text variant="headlineMedium">{t('Backing up to iCloud...')}</Text>
        </Flex>
      ) : (
        <Flex centered grow gap="none" mb="lg">
          <CheckmarkCircle color={theme.colors.accentAction} size={dimensions.fullWidth / 4} />
          <Text variant="headlineMedium">{t('iCloud backup successful')}</Text>
        </Flex>
      )}
    </Screen>
  )
}
