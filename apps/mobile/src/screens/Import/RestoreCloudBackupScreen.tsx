import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, Text, TouchableArea, Unicon, useIsDarkMode } from 'ui/src'
import { DownloadAlt, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { FORMAT_DATE_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { shortenAddress } from 'utilities/src/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

export function RestoreCloudBackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const localizedDayjs = useLocalizedDayjs()

  const backups = useCloudBackups()
  const sortedBackups = backups.slice().sort((a, b) => b.createdAt - a.createdAt)

  const onPressRestoreBackup = async (backup: CloudStorageMnemonicBackup): Promise<void> => {
    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupPassword,
      params: { ...params, mnemonicId: backup.mnemonicId },
      merge: true,
    })
  }

  useNavigationHeader(navigation)

  return (
    <OnboardingScreen
      Icon={DownloadAlt}
      subtitle={t('account.cloud.backup.subtitle', { cloudProviderName: getCloudProviderName() })}
      title={t('account.cloud.backup.title')}
    >
      <ScrollView>
        <Flex gap="$spacing8">
          {sortedBackups.map((backup) => {
            const { mnemonicId, createdAt } = backup
            return (
              <TouchableArea
                key={backup.mnemonicId}
                backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
                borderColor="$surface3"
                borderRadius="$rounded20"
                borderWidth="$spacing1"
                p="$spacing16"
                shadowColor="$surface3"
                shadowRadius={!isDarkMode ? '$spacing4' : undefined}
                onPress={(): Promise<void> => onPressRestoreBackup(backup)}
              >
                <Flex row alignItems="center" justifyContent="space-between">
                  <Flex centered row gap="$spacing12">
                    <Unicon address={mnemonicId} size={32} />
                    <Flex>
                      <Text adjustsFontSizeToFit variant="subheading1">
                        {sanitizeAddressText(shortenAddress(mnemonicId))}
                      </Text>
                      <Text adjustsFontSizeToFit color="$neutral2" variant="body3">
                        {localizedDayjs.unix(createdAt).format(FORMAT_DATE_TIME_SHORT)}
                      </Text>
                    </Flex>
                  </Flex>
                  <RotatableChevron
                    color="$neutral2"
                    direction="end"
                    height={iconSizes.icon20}
                    width={iconSizes.icon20}
                  />
                </Flex>
              </TouchableArea>
            )
          })}
        </Flex>
      </ScrollView>
    </OnboardingScreen>
  )
}
