import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import {
  AppStackParamList,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { EducationContentType } from 'src/components/education'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
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

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={1}
      subtitle={t(
        'Back up your seed phrase so that that you can access your wallet on another device. You can always add a backup in Settings.'
      )}
      title={t('Choose a backup option')}>
      <Flex grow justifyContent="space-between">
        <BackupOptions backupMethods={activeAccountBackups} />

        <TextButton
          alignSelf="center"
          bg="gray50"
          borderRadius="md"
          px="md"
          py="sm"
          textColor="textColor"
          textVariant="buttonLabel"
          onPress={onPressEducationButton}>
          <Text color="yellow" fontSize={20}>
            ✦{' '}
          </Text>
          {t("What's a seed phrase?")}
        </TextButton>

        <Flex justifyContent="flex-end">
          <PrimaryButton
            disabled={!activeAccountBackups || activeAccountBackups.length < 1}
            label={t('Next')}
            name={ElementName.Next}
            testID={ElementName.Next}
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

  const spacer = <Box borderTopColor="gray50" borderTopWidth={1} />
  return (
    <Flex gap="lg">
      {spacer}
      <BackupOptionButton
        completed={backupMethods?.includes(BackupType.Cloud)}
        icon={<CloudIcon height={20} stroke={theme.colors.white} width={20} />}
        label={t('iCloud backup')}
        name={ElementName.AddiCloudBackup}
        onPress={() => {
          navigate(OnboardingScreens.BackupCloud, {})
        }}
      />
      {spacer}
      <BackupOptionButton
        completed={backupMethods?.includes(BackupType.Manual)}
        icon={<PencilIcon height={20} stroke={theme.colors.white} width={20} />}
        label={t('Manual backup')}
        name={ElementName.AddManualBackup}
        onPress={() => {
          navigate(OnboardingScreens.BackupManual)
        }}
      />
      {spacer}
    </Flex>
  )
}

interface BackupOptionButtonProps {
  completed?: boolean
  icon: ReactNode
  label: string
  name?: ElementName
  onPress: () => void
}

function BackupOptionButton({ icon, label, name, onPress, completed }: BackupOptionButtonProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Flex gap="lg">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex centered row>
          <Box height={40} width={40}>
            <LinearGradientBox radius="md" stops={RainbowLinearGradientStops}>
              <Box alignItems="center" justifyContent="center" style={styles.padded}>
                <Box bg="gray50" borderRadius="md" height={38} p="sm" width={38}>
                  {icon}
                </Box>
              </Box>
            </LinearGradientBox>
          </Box>
          <Text variant="body">{label}</Text>
        </Flex>
        {completed ? (
          <CheckmarkCircle backgroundColor="none" color={theme.colors.textColor} size={40} />
        ) : (
          <TextButton
            bg="gray50"
            borderRadius="lg"
            disabled={false}
            name={name}
            p="sm"
            testID={name}
            textColor="textColor"
            textVariant="buttonLabel"
            onPress={onPress}>
            {t('+ Add')}
          </TextButton>
        )}
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  padded: {
    padding: 1,
  },
})
