import React from 'react'
import { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { useLineChartDatetime } from 'react-native-wagmi-charts'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { AnimatedDecimalNumber } from './AnimatedDecimalNumber'
import { useLineChartPrice, useLineChartRelativeChange } from './usePrice'

export function PriceText({ loading }: { loading: boolean }): JSX.Element {
  const price = useLineChartPrice()

  if (loading) {
    return <Text loading loadingPlaceholderText="$10,000" variant="headlineLarge" />
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
  const theme = useAppTheme()

  const relativeChange = useLineChartRelativeChange({ spotRelativeChange })
  const icon = useDerivedValue(() => (relativeChange.value.value > 0 ? '↗' : '↘'))
  const styles = useAnimatedStyle(() => ({
    color:
      relativeChange.value.value > 0 ? theme.colors.accentSuccess : theme.colors.accentCritical,
  }))

  if (loading) {
    return <Text loading loadingPlaceholderText="00.00%" variant="bodyLarge" />
  }

  return (
    <Flex row gap="spacing2">
      <AnimatedText style={styles} testID="relative-change-icon" text={icon} variant="bodyLarge" />
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

  return <AnimatedText color="textSecondary" text={datetime.formatted} variant="bodyLarge" />
}
