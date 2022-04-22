import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'

interface OnboardingScreenProps {
  stepCount: number
  stepNumber: number
  subtitle: string
  title: string
}

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
          <Indicator count={stepCount} current={stepNumber} />
          <Box flex={1}>{/* ensures indicator is centered */}</Box>
        </Flex>

        <Flex centered gap="sm" m="sm">
          <Text fontWeight="600" textAlign="center" variant="h4">
            {title}
          </Text>
          <Text color="gray400" textAlign="center" variant="body">
            {subtitle}
          </Text>
        </Flex>

        {children}
      </Flex>
    </Screen>
  )
}

function Indicator({ count, current }: { count: number; current: number }) {
  return (
    <Flex row gap="sm">
      {[...Array(count)].map((_, i) => (
        <Box
          key={`indicator-${i}`}
          bg="textColor"
          borderRadius="lg"
          height={4}
          opacity={i === current ? 1 : 0.2}
          width={40}
        />
      ))}
    </Flex>
  )
}
