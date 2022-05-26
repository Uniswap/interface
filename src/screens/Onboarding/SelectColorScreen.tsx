import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectColor>

export function SelectColorScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const onPressNext = () => {
    navigation.navigate(OnboardingScreens.Backup)
  }

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={1}
      subtitle={t(
        'Make your wallet feel like you by selecting a color. We’ll generate a special gradient based on your address'
      )}
      title={t('Choose a color')}>
      <Box />
      <Flex justifyContent="flex-end">
        <PrimaryButton
          label={t('Next')}
          name={ElementName.Next}
          py="md"
          testID={ElementName.Next}
          textColor="white"
          textVariant="mediumLabel"
          variant="blue"
          onPress={onPressNext}
        />
      </Flex>
    </OnboardingScreen>
  )
}
