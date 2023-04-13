import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
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
} from 'src/features/wallet/pendingAccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'
import { formatDate } from 'src/utils/format'
import { useAddBackButton } from 'src/utils/useAddBackButton'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

export function RestoreCloudBackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const backups = useCloudBackups()
  const sortedBackups = backups.slice().sort((a, b) => b.createdAt - a.createdAt)

  const onPressRestoreBackup = async (backup: ICloudMnemonicBackup): Promise<void> => {
    // Clear any existing pending accounts
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))

    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupPassword,
      params: { ...params, mnemonicId: backup.mnemonicId },
      merge: true,
    })
  }

  useAddBackButton(navigation)

  return (
    <OnboardingScreen
      subtitle={t('There are multiple recovery phrases backed up to your iCloud.')}
      title={t('Select backup to restore')}>
      <ScrollView>
        <Flex gap="spacing8">
          {sortedBackups.map((backup, index) => {
            const { mnemonicId, createdAt } = backup
            return (
              <TouchableArea
                key={backup.mnemonicId}
                backgroundColor="background2"
                borderColor="background3"
                borderRadius="rounded16"
                borderWidth={1}
                p="spacing16"
                onPress={(): Promise<void> => onPressRestoreBackup(backup)}>
                <Flex row alignItems="center" justifyContent="space-between">
                  <Flex centered row gap="spacing12">
                    <Unicon address={mnemonicId} size={32} />
                    <Flex gap="none">
                      <Text numberOfLines={1} variant="subheadSmall">
                        {t('Backup {{backupIndex}}', { backupIndex: sortedBackups.length - index })}
                      </Text>
                      <Text color="textSecondary" variant="buttonLabelMicro">
                        {shortenAddress(mnemonicId)}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex row gap="spacing12">
                    <Flex alignItems="flex-end" gap="spacing4">
                      <Text color="textSecondary" variant="buttonLabelMicro">
                        {t('Backed up on:')}
                      </Text>
                      <Text variant="buttonLabelMicro">
                        {formatDate(new Date(createdAt * 1000))}
                      </Text>
                    </Flex>
                    <Chevron color={theme.colors.textPrimary} direction="e" />
                  </Flex>
                </Flex>
              </TouchableArea>
            )
          })}
        </Flex>
      </ScrollView>
    </OnboardingScreen>
  )
}
