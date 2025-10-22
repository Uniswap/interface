import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { DownloadAlt, RotatableChevron, Unitag } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { FORMAT_DATE_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { useEvent } from 'utilities/src/react/hooks'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

export function RestoreCloudBackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()

  const sortedBackups = params.backups.slice().sort((a, b) => b.createdAt - a.createdAt)

  const onPressRestoreBackup = useEvent((backup: CloudStorageMnemonicBackup): void => {
    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupPassword,
      params: { ...params, mnemonicId: backup.mnemonicId },
      merge: true,
    })
  })

  useNavigationHeader(navigation)

  return (
    <OnboardingScreen
      Icon={DownloadAlt}
      subtitle={t('account.cloud.backup.subtitle', { cloudProviderName: getCloudProviderName() })}
      title={t('account.cloud.backup.title')}
    >
      <ScrollView>
        <Flex gap="$spacing8">
          {sortedBackups.map((backup) => (
            <BackupListItem key={backup.mnemonicId} backup={backup} onPressRestoreBackup={onPressRestoreBackup} />
          ))}
        </Flex>
      </ScrollView>
    </OnboardingScreen>
  )
}

const BackupListItem = ({
  backup,
  onPressRestoreBackup,
}: {
  backup: CloudStorageMnemonicBackup
  onPressRestoreBackup: (backup: CloudStorageMnemonicBackup) => void
}): JSX.Element => {
  const { mnemonicId, createdAt } = backup
  const isDarkMode = useIsDarkMode()
  const localizedDayjs = useLocalizedDayjs()
  const displayName = useDisplayName(mnemonicId)
  const isUnitag = displayName?.type === DisplayNameType.Unitag

  return (
    <TouchableArea
      backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      p="$spacing16"
      shadowColor="$surface3"
      shadowRadius={!isDarkMode ? '$spacing4' : undefined}
      onPress={(): void => onPressRestoreBackup(backup)}
    >
      <Flex row alignItems="center" gap="$spacing12">
        <AccountIcon address={mnemonicId} size={iconSizes.icon36} />
        <Flex flex={1}>
          <Flex row>
            <Text adjustsFontSizeToFit variant="subheading1">
              {displayName?.name}
            </Text>
            {isUnitag && (
              <Flex alignSelf="center" pl="$spacing4">
                <Unitag size="$icon.24" />
              </Flex>
            )}
          </Flex>
          <Text adjustsFontSizeToFit color="$neutral2" variant="body3">
            {localizedDayjs.unix(createdAt).format(FORMAT_DATE_TIME_SHORT)}
          </Text>
        </Flex>
        <Flex>
          <RotatableChevron color="$neutral2" direction="end" height={iconSizes.icon20} width={iconSizes.icon20} />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
