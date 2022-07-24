import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { ICloudMnemonicBackup } from 'src/features/CloudBackup/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'
import { formatDate } from 'src/utils/format'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

export function RestoreCloudBackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const backups = useCloudBackups()

  const onPressRestoreBackup = (backup: ICloudMnemonicBackup) => {
    if (backup.isPinEncrypted) {
      navigation.navigate({
        name: OnboardingScreens.RestoreCloudBackupPin,
        params: { ...params, mnemonicId: backup.mnemonicId },
        merge: true,
      })
    } else {
      // TODO(fetch-icloud-backups-p3): Dispatch importAccountActions with ImportAcountType.Restore to load mnemonic from backup
      navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
    }
  }

  return (
    <OnboardingScreen
      subtitle={t("Please select which backup you'd like to recover")}
      title={t('We found multiple recovery phrase backups')}>
      <Flex gap="xs">
        {backups.map((backup, index) => {
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
                    <Text numberOfLines={1} variant="body">
                      {t('Backup {{backupIndex}}', { backupIndex: index + 1 })}
                    </Text>
                    <Text color="textSecondary" variant="caption">
                      {shortenAddress(mnemonicId)}
                    </Text>
                  </Flex>
                </Flex>
                <Flex row gap="sm">
                  <Flex alignItems="flex-end" gap="xxs">
                    <Text color="textSecondary" variant="caption">
                      {t('Backed up on:')}
                    </Text>
                    <Text variant="caption">{formatDate(new Date(createdAt * 1000))}</Text>
                  </Flex>
                  <Chevron color={theme.colors.textPrimary} direction="e" />
                </Flex>
              </Flex>
            </Button>
          )
        })}
      </Flex>
    </OnboardingScreen>
  )
}
