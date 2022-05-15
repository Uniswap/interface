import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
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
} & StepProps

export function OnboardingScreen({
  title,
  subtitle,
  stepCount,
  stepNumber,
  children,
}: PropsWithChildren<OnboardingScreenProps>) {
  return (
    <Screen>
      <Flex grow px="md" py="lg">
        <Flex row alignItems="center">
          <Box alignItems="flex-start" flex={1}>
            <BackButton />
          </Box>
          {stepCount !== undefined && stepNumber !== undefined ? (
            <Indicator currentStep={stepNumber} stepCount={stepCount} />
          ) : null}
          <Box flex={1}>{/* ensures indicator is centered */}</Box>
        </Flex>

        <Flex centered gap="sm" m="sm">
          <Text fontWeight="600" textAlign="center" variant="mediumLabel">
            {title}
          </Text>
          {subtitle ? (
            <Text color="deprecated_gray400" textAlign="center" variant="body1">
              {subtitle}
            </Text>
          ) : null}
        </Flex>

        <Flex grow justifyContent="space-between">
          {children}
        </Flex>
      </Flex>
    </Screen>
  )
}
