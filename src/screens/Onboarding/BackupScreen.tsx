import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import {
  AppStackParamList,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import PencilIcon from 'src/assets/icons/pencil.svg'
import StarGroup from 'src/assets/icons/star-group.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { EducationContentType } from 'src/components/education'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { BackupType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

type Props = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, Screens.Education>
>

export function BackupScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const activeAccountBackups = useActiveAccount()?.backups

  const onPressNext = () => {
    navigation.navigate(OnboardingScreens.Notifications)
  }

  const onPressEducationButton = () => {
    navigation.navigate(Screens.Education, { type: EducationContentType.SeedPhrase })
  }

  const disabled = !activeAccountBackups || activeAccountBackups.length < 1

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={1}
      subtitle={t(
        'Backups let you restore your wallet if you lose your device––we recommend adding both types.'
      )}
      title={t('Back up your recovery phrase')}>
      <Flex grow>
        <BackupOptions backupMethods={activeAccountBackups} />
        <Button alignSelf="center" py="sm" onPress={onPressEducationButton}>
          <Flex centered row gap="xs">
            <StarGroup height={16} width={16} />
            <Text variant="mediumLabel">{t('What’s a recovery phrase?')}</Text>
          </Flex>
        </Button>
        <Flex grow justifyContent="flex-end">
          <PrimaryButton
            disabled={disabled}
            label={disabled ? t('Add backup to continue') : t('Next')}
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

function BackupOptions({ backupMethods }: { backupMethods?: BackupType[] }) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const { navigate } = useOnboardingStackNavigation()

  return (
    <Flex gap="lg">
      <BackupOptionButton
        caption={t('Easily restore your wallet by backing up your recovery phrase to your iCloud.')}
        completed={backupMethods?.includes(BackupType.Cloud)}
        icon={<CloudIcon color={theme.colors.deprecated_blue} height={20} width={20} />}
        label={t('iCloud backup')}
        name={ElementName.AddiCloudBackup}
        onPress={() => {
          navigate(OnboardingScreens.BackupCloud, {})
        }}
      />
      <BackupOptionButton
        caption={t('Write down your recovery phrase and store it in a safe yet memorable place.')}
        completed={backupMethods?.includes(BackupType.Manual)}
        icon={<PencilIcon color={theme.colors.deprecated_yellow} height={20} width={20} />}
        label={t('Manual backup')}
        name={ElementName.AddManualBackup}
        onPress={() => {
          navigate(OnboardingScreens.BackupManual)
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
    <Button
      backgroundColor="translucentBackground"
      borderColor={!completed ? 'lightBorder' : 'none'}
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
          <Text color="neutralTextSecondary" variant="caption">
            {caption}
          </Text>
        </Flex>
        <Flex grow alignItems="flex-end">
          {completed ? (
            <CheckmarkCircle
              backgroundColor="none"
              color={theme.colors.accentBackgroundSuccess}
              size={40}
            />
          ) : (
            <Chevron color={theme.colors.lightBorder} direction="e" height="20" width="15" />
          )}
        </Flex>
      </Flex>
    </Button>
  )
}
