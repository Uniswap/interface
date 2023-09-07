import React from 'react'
import { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { dimensions } from 'ui/src/theme'

const { fullWidth } = dimensions
const INDICATOR_WIDTH = (200 / 375) * fullWidth

export function Indicator({
  stepCount,
  currentStep,
}: {
  stepCount: number
  currentStep: number
}): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      gap="spacing8"
      justifyContent="space-evenly"
      width={INDICATOR_WIDTH}>
      {[...Array(stepCount)].map((_, i) => (
        <Box
          key={`indicator-${i}`}
          bg="neutral1"
          borderRadius="rounded16"
          flex={1}
          height={4}
          opacity={i === currentStep ? 1 : 0.2}
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
}): JSX.Element {
  return (
    <Flex centered row gap="spacing12" px="spacing24">
      {[...Array(stepCount)].map((_, i) => (
        <AnimatedIndicatorPill index={i} scroll={scroll} />
      ))}
    </Flex>
  )
}

function AnimatedIndicatorPill({
  index,
  scroll,
}: {
  index: number
  scroll: SharedValue<number>
}): JSX.Element {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * fullWidth, index * fullWidth, (index + 1) * fullWidth]
    return {
      opacity: interpolate(scroll.value, inputRange, [0.2, 1, 0.2], Extrapolate.CLAMP),
    }
  })

  return (
    <AnimatedBox
      key={`indicator-${index}`}
      bg="$neutral1"
      borderRadius="$rounded16"
      flex={1}
      gap="$none"
      height={4}
      style={style}
    />
  )
}
