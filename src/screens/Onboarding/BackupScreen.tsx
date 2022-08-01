import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import React, { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import {
  AppStackParamList,
  OnboardingStackBaseParams,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import Check from 'src/assets/icons/check.svg'
import CloudIcon from 'src/assets/icons/cloud.svg'
import PencilIcon from 'src/assets/icons/pencil.svg'
import StarGroup from 'src/assets/icons/star-group.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { EducationContentType } from 'src/components/education'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { BackupType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, Screens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()

  const activeAccountBackups = useActiveAccount()?.backups

  const onPressNext = () => {
    navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
  }

  const onPressEducationButton = () => {
    navigation.navigate(Screens.Education, { type: EducationContentType.SeedPhrase })
  }

  const disabled = !activeAccountBackups || activeAccountBackups.length < 1

  return (
    <OnboardingScreen
      subtitle={t(
        'Backups let you restore your wallet if you lose your device––we recommend adding both types.'
      )}
      title={t('Back up your recovery phrase')}>
      <Flex grow>
        <BackupOptions backupMethods={activeAccountBackups} params={params} />
        <Button alignSelf="center" py="sm" onPress={onPressEducationButton}>
          <Flex centered row gap="xs">
            <StarGroup height={16} width={16} />
            <Text variant="mediumLabel">{t('What’s a recovery phrase?')}</Text>
          </Flex>
        </Button>
        <Flex grow justifyContent="flex-end">
          <PrimaryButton
            disabled={disabled}
            label={disabled ? t('Add backup to continue') : t('Continue')}
            name={ElementName.Next}
            testID={ElementName.Next}
            variant="onboard"
            onPress={onPressNext}
          />
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function BackupOptions({
  backupMethods,
  params,
}: {
  backupMethods?: BackupType[]
  params: Readonly<OnboardingStackBaseParams>
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [iCloudAvailable, setICloudAvailable] = useState<boolean>()

  const { navigate } = useOnboardingStackNavigation()

  useEffect(() => {
    async function checkICloudAvailable() {
      const available = await isICloudAvailable()
      setICloudAvailable(available)
    }
    checkICloudAvailable()
  }, [])

  return (
    <Flex gap="lg">
      <BackupOptionButton
        caption={t('Easily restore your wallet by backing up your recovery phrase to your iCloud.')}
        completed={backupMethods?.includes(BackupType.Cloud)}
        icon={<CloudIcon color={theme.colors.accentActive} height={20} width={20} />}
        label={t('iCloud backup')}
        name={ElementName.AddiCloudBackup}
        onPress={() => {
          if (!iCloudAvailable) {
            Alert.alert(
              t('iCloud Not Available'),
              t('Please verify you are logged into an Apple ID with iCloud enabled and try again.'),
              [
                {
                  text: t('OK'),
                  style: 'default',
                },
              ]
            )
            return
          }

          // TODO: Remove alert when tested and reviewed
          Alert.alert(
            'iCloud Backup Warning',
            'iCloud backup is currently in development and currently stores your recovery phrase in plain text in iCloud. It is recommended to only use this feature with test wallets for now.',
            [
              {
                text: t('Continue'),
                style: 'default',
                onPress: () => {
                  navigate({
                    name: OnboardingScreens.BackupCloud,
                    params: { importType: params?.importType },
                    merge: true,
                  })
                },
              },
              {
                text: t('Cancel'),
                style: 'cancel',
              },
            ]
          )
        }}
      />
      <BackupOptionButton
        caption={t('Write down your recovery phrase and store it in a safe yet memorable place.')}
        completed={backupMethods?.includes(BackupType.Manual)}
        icon={<PencilIcon color={theme.colors.accentWarning} height={20} width={20} />}
        label={t('Manual backup')}
        name={ElementName.AddManualBackup}
        onPress={() => {
          navigate({ name: OnboardingScreens.BackupManual, params, merge: true })
        }}
      />
    </Flex>
  )
}

interface BackupOptionButtonProps {
  completed?: boolean
  icon: ReactNode
  label: string
  caption: string
  name?: ElementName
  onPress: () => void
}

function BackupOptionButton({
  icon,
  label,
  name,
  caption,
  onPress,
  completed,
}: BackupOptionButtonProps) {
  const theme = useAppTheme()
  return (
    <Box opacity={completed ? 0.4 : 1}>
      <Button
        backgroundColor="backgroundContainer"
        borderColor="backgroundOutline"
        borderRadius="lg"
        borderWidth={1}
        disabled={completed}
        name={name}
        padding="lg"
        testID={name}
        onPress={onPress}>
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex flexShrink={1} gap="xs" maxWidth="80%">
            <Flex row gap="sm">
              <Box height={20} width={20}>
                {icon}
              </Box>
              <Text variant="mediumLabel">{label}</Text>
            </Flex>
            <Text color="textSecondary" variant="caption">
              {caption}
            </Text>
          </Flex>
          <Flex grow alignItems="flex-end">
            {completed ? (
              <Check color={theme.colors.accentSuccess} height="24" width="24" />
            ) : (
              <Chevron color={theme.colors.textSecondary} direction="e" height="24" width="24" />
            )}
          </Flex>
        </Flex>
      </Button>
    </Box>
  )
}
