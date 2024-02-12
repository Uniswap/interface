import { NativeStackScreenProps } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Flex, Icons, Text, TouchableArea, Unicon, useIsDarkMode } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import { isAndroid } from 'wallet/src/utils/platform'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

export function RestoreCloudBackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()
  // const backups = useMockCloudBackups(4) // returns 4 mock backups with random mnemonicIds and createdAt dates
  const backups = useCloudBackups()
  const sortedBackups = backups.slice().sort((a, b) => b.createdAt - a.createdAt)

  const onPressRestoreBackup = async (backup: CloudStorageMnemonicBackup): Promise<void> => {
    // Clear any existing pending accounts
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))

    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupPassword,
      params: { ...params, mnemonicId: backup.mnemonicId },
      merge: true,
    })
  }

  useAddBackButton(navigation)

  return (
    <OnboardingScreen
      subtitle={
        isAndroid
          ? t('There are multiple recovery phrases backed up to your Google Drive.')
          : t('There are multiple recovery phrases backed up to your iCloud.')
      }
      title={t('Select a backup to restore')}>
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
                borderWidth={1}
                p="$spacing16"
                shadowColor="$surface3"
                shadowRadius={!isDarkMode ? '$spacing4' : undefined}
                onPress={(): Promise<void> => onPressRestoreBackup(backup)}>
                <Flex row alignItems="center" justifyContent="space-between">
                  <Flex centered row gap="$spacing12">
                    <Unicon address={mnemonicId} size={32} />
                    <Flex>
                      <Text adjustsFontSizeToFit variant="subheading1">
                        {sanitizeAddressText(shortenAddress(mnemonicId))}
                      </Text>
                      <Text adjustsFontSizeToFit color="$neutral2" variant="buttonLabel4">
                        {dayjs.unix(createdAt).format('MMM D, YYYY [at] h:mma')}
                      </Text>
                    </Flex>
                  </Flex>
                  <Icons.RotatableChevron
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
