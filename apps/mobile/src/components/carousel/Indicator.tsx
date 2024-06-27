import React from 'react'
import { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { AnimatedFlex, Flex, useDeviceDimensions } from 'ui/src'

export function Indicator({
  stepCount,
  currentStep,
}: {
  stepCount: number
  currentStep: number
}): JSX.Element {
  const { fullWidth } = useDeviceDimensions()
  const indicatorWidth = (200 / 375) * fullWidth

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      justifyContent="space-evenly"
      width={indicatorWidth}>
      {[...Array(stepCount)].map((_, i) => (
        <Flex
          key={`indicator-${i}`}
          fill
          backgroundColor="$neutral1"
          borderRadius="$rounded16"
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
    <Flex centered row gap="$spacing12" px="$spacing24">
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
  const { fullWidth } = useDeviceDimensions()
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * fullWidth, index * fullWidth, (index + 1) * fullWidth]
    return {
      opacity: interpolate(scroll.value, inputRange, [0.2, 1, 0.2], Extrapolate.CLAMP),
    }
  })

  return (
    <AnimatedFlex
      key={`indicator-${index}`}
      fill
      backgroundColor="$neutral1"
      borderRadius="$rounded16"
      height={4}
      style={style}
    />
  )
}
