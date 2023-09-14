import React from 'react'
import { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useLineChartDatetime } from 'react-native-wagmi-charts'
import { Flex } from 'src/components/layout'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { IS_ANDROID } from 'src/constants/globals'
import { Icons, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AnimatedDecimalNumber } from './AnimatedDecimalNumber'
import { useLineChartPrice, useLineChartRelativeChange } from './usePrice'

export function PriceText({ loading }: { loading: boolean }): JSX.Element {
  const price = useLineChartPrice()

  if (loading) {
    return <AnimatedText loading loadingPlaceholderText="$10,000" variant="headlineLarge" />
  }

  return <AnimatedDecimalNumber number={price} testID="price-text" variant="headlineLarge" />
}

export function RelativeChangeText({
  loading,
  spotRelativeChange,
}: {
  loading: boolean
  spotRelativeChange?: SharedValue<number>
}): JSX.Element {
  const colors = useSporeColors()

  const relativeChange = useLineChartRelativeChange({ spotRelativeChange })

  const styles = useAnimatedStyle(() => ({
    color: relativeChange.value.value > 0 ? colors.statusSuccess.val : colors.statusCritical.val,
  }))
  const caretStyle = useAnimatedStyle(() => ({
    color: relativeChange.value.value > 0 ? colors.statusSuccess.val : colors.statusCritical.val,
    transform: [{ rotate: relativeChange.value.value > 0 ? '180deg' : '0deg' }],
  }))

  if (loading) {
    return (
      <Flex mt={IS_ANDROID ? 'none' : 'spacing2'}>
        <AnimatedText loading loadingPlaceholderText="00.00%" variant="bodyLarge" />
      </Flex>
    )
  }

  return (
    <Flex
      row
      alignItems={IS_ANDROID ? 'center' : 'flex-end'}
      gap="spacing2"
      mt={IS_ANDROID ? 'none' : 'spacing2'}>
      <Icons.AnimatedCaretChange
        height={iconSizes.icon16}
        strokeWidth={2}
        style={[
          caretStyle,
          // fix vertical centering
          // eslint-disable-next-line react-native/no-inline-styles
          { translateY: relativeChange.value.value > 0 ? -1 : 1 },
        ]}
        width={iconSizes.icon16}
      />
      <AnimatedText
        style={styles}
        testID="relative-change-text"
        text={relativeChange.formatted}
        variant="bodyLarge"
      />
    </Flex>
  )
}

export function DatetimeText({ loading }: { loading: boolean }): JSX.Element | null {
  // `datetime` when scrubbing the chart
  const datetime = useLineChartDatetime()

  if (loading) return null

  return <AnimatedText color="neutral2" text={datetime.formatted} variant="bodyLarge" />
}
