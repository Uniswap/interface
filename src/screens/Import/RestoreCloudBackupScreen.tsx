import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'
import { formatDate } from 'src/utils/format'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

export function RestoreCloudBackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const backups = useCloudBackups()
  const sortedBackups = backups.slice().sort((a, b) => a.createdAt - b.createdAt)

  const onPressRestoreBackup = async (backup: ICloudMnemonicBackup) => {
    // Clear any existing pending accounts
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))

    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupPassword,
      params: { ...params, mnemonicId: backup.mnemonicId },
      merge: true,
    })
  }

  return (
    <OnboardingScreen
      subtitle={t('There are multiple recovery phrases backed up to your iCloud.')}
      title={t('Select backup to restore')}>
      <ScrollView>
        <Flex gap="xs">
          {sortedBackups.map((backup, index) => {
            const { mnemonicId, createdAt } = backup
            return (
              <Button
                key={backup.mnemonicId}
                backgroundColor="backgroundContainer"
                borderColor="backgroundAction"
                borderRadius="lg"
                borderWidth={1}
                p="md"
                onPress={() => onPressRestoreBackup(backup)}>
                <Flex row alignItems="center" justifyContent="space-between">
                  <Flex centered row gap="sm">
                    <Unicon address={mnemonicId} size={32} />
                    <Flex gap="none">
                      <Text numberOfLines={1} variant="bodyLarge">
                        {t('Backup {{backupIndex}}', { backupIndex: index + 1 })}
                      </Text>
                      <Text color="textSecondary" variant="caption_deprecated">
                        {shortenAddress(mnemonicId)}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex row gap="sm">
                    <Flex alignItems="flex-end" gap="xxs">
                      <Text color="textSecondary" variant="caption_deprecated">
                        {t('Backed up on:')}
                      </Text>
                      <Text variant="caption_deprecated">
                        {formatDate(new Date(createdAt * 1000))}
                      </Text>
                    </Flex>
                    <Chevron color={theme.colors.textPrimary} direction="e" />
                  </Flex>
                </Flex>
              </Button>
            )
          })}
        </Flex>
      </ScrollView>
    </OnboardingScreen>
  )
}
