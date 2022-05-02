import React from 'react'
import Animated, { Extrapolate } from 'react-native-reanimated'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { dimensions } from 'src/styles/sizing'

const { fullWidth } = dimensions

export function Indicator({ stepCount, currentStep }: { stepCount: number; currentStep: number }) {
  return (
    <Flex row gap="sm">
      {[...Array(stepCount)].map((_, i) => (
        <Box
          key={`indicator-${i}`}
          bg="textColor"
          borderRadius="lg"
          height={4}
          opacity={i === currentStep ? 1 : 0.2}
          width={40}
        />
      ))}
    </Flex>
  )
}

export function AnimatedIndicator({
  scrollX,
  stepCount,
}: {
  scrollX: Animated.Value<number>
  stepCount: number
}) {
  return (
    <Flex centered row gap="md" px="lg">
      {[...Array(stepCount)].map((_, i) => {
        const inputRange = [(i - 1) * fullWidth, i * fullWidth, (i + 1) * fullWidth]
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.2, 1, 0.2],
          extrapolate: Extrapolate.CLAMP,
        })

        return (
          <AnimatedBox
            key={`indicator-${i}`}
            bg="textColor"
            borderRadius="lg"
            flex={1}
            height={4}
            opacity={opacity}
          />
        )
      })}
    </Flex>
  )
}
