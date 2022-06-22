import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { BackupType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudProcessing
>

/** Screen to perform secure recovery phrase backup/restore to Cloud  */
export function CloudBackupProcessingScreen({
  navigation,
  route: {
    params: { type, importType },
  },
}: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const [processing, doneProcessing] = useReducer(() => false, true)

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

  useEffect(() => {
    if (!activeAccount?.address) return
    if (type !== 'backup') return

    // TODO: perform backup with native module

    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.AddBackupMethod,
        address: activeAccount.address,
        backupMethod: BackupType.Cloud,
      })
    )
  }, [activeAccount?.address, dispatch, type])

  return (
    <Screen>
      {processing ? (
        <Flex centered grow gap="xl">
          <ActivityIndicator size="large" />
          <Text variant="h2">{t('Backing up to iCloud...')}</Text>
        </Flex>
      ) : (
        <Flex centered grow gap="none" mb="lg">
          <CheckmarkCircle
            color={theme.colors.deprecated_primary1}
            size={dimensions.fullWidth / 4}
          />
          <Text variant="h2">{t('iCloud backup successful')}</Text>
        </Flex>
      )}
    </Screen>
  )
}
