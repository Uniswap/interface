import React from 'react'
import { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
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
  scroll,
  stepCount,
}: {
  scroll: SharedValue<number>
  stepCount: number
}) {
  return (
    <Flex centered row gap="sm" px="lg">
      {[...Array(stepCount)].map((_, i) => (
        <AnimatedIndicatorPill index={i} scroll={scroll} />
      ))}
    </Flex>
  )
}

function AnimatedIndicatorPill({ index, scroll }: { index: number; scroll: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * fullWidth, index * fullWidth, (index + 1) * fullWidth]
    return {
      opacity: interpolate(scroll.value, inputRange, [0.2, 1, 0.2], Extrapolate.CLAMP),
    }
  })

  return (
    <AnimatedBox
      key={`indicator-${index}`}
      bg="textColor"
      borderRadius="lg"
      flex={1}
      height={4}
      style={style}
    />
  )
}
