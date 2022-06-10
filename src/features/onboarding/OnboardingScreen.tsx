import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Indicator } from 'src/components/carousel/Indicator'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'

type StepProps =
  | {
      stepCount: number
      stepNumber: number
    }
  | {
      stepCount?: undefined
      stepNumber?: undefined
    }

type OnboardingScreenProps = {
  subtitle?: string
  title: string
  onSkip?: () => void
} & StepProps

export function OnboardingScreen({
  title,
  subtitle,
  onSkip,
  stepCount,
  stepNumber,
  children,
}: PropsWithChildren<OnboardingScreenProps>) {
  const { t } = useTranslation()

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={WrapperStyle.base}>
        <Flex grow px="md" py="lg">
          {/* header */}
          <Flex row alignItems="center">
            <Box alignItems="flex-start" flex={1}>
              <BackButton size={16} />
            </Box>
            {stepCount !== undefined && stepNumber !== undefined ? (
              <Indicator currentStep={stepNumber} stepCount={stepCount} />
            ) : (
              <Box flex={1} /> // ensure centered items
            )}
            <Box alignItems="flex-end" flex={1}>
              {onSkip ? (
                <TextButton textColor="neutralTextSecondary" textVariant="body2" onPress={onSkip}>
                  {t('Skip')}
                </TextButton>
              ) : null}
            </Box>
          </Flex>

          {/* Text content */}
          <Flex centered gap="sm" m="sm">
            <Text fontWeight="600" textAlign="center" variant="largeLabel">
              {title}
            </Text>
            {subtitle ? (
              <Text color="neutralTextSecondary" textAlign="center" variant="body1">
                {subtitle}
              </Text>
            ) : null}
          </Flex>

          {/* page content */}
          <Flex grow justifyContent="space-between">
            {children}
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const WrapperStyle = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
