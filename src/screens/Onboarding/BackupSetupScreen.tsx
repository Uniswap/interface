import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>

export function BackupSetupScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const onPressNext = () => {
    navigation.navigate(OnboardingScreens.Notifications)
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
        <BackupOptions />

        <Flex justifyContent="flex-end">
          <PrimaryButton label={t('Next')} name={ElementName.Next} onPress={onPressNext} />
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function BackupOptions() {
  const { t } = useTranslation()
  const spacer = <Box borderTopColor="gray50" borderTopWidth={1} />
  return (
    <Flex gap="lg">
      {spacer}
      <BackupOptionButton
        icon={<CloudIcon height={20} stroke="white" width={20} />}
        label={t('iCloud backup')}
        name={ElementName.AddiCloudBackup}
      />
      {spacer}
      <BackupOptionButton
        icon={<PencilIcon height={20} stroke="white" width={20} />}
        label={t('Manual backup')}
        name={ElementName.AddManualBackup}
      />
      {spacer}
    </Flex>
  )
}

interface BackupOptionButtonProps {
  icon: ReactNode
  label: string
  name?: ElementName
}

function BackupOptionButton({ icon, label, name }: BackupOptionButtonProps) {
  const { t } = useTranslation()
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
        <TextButton
          bg="gray50"
          borderRadius="lg"
          disabled={true}
          name={name}
          opacity={0.5}
          p="sm"
          textColor="textColor"
          textVariant="buttonLabel">
          {t('+ Add')}
        </TextButton>
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  padded: {
    padding: 1,
  },
})
