import React from 'react'
import { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useLineChartDatetime } from 'react-native-wagmi-charts'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { IS_ANDROID } from 'src/constants/globals'
import { Flex, Icons, useSporeColors } from 'ui/src'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'wallet/src/features/language/hooks'
import { AnimatedDecimalNumber } from './AnimatedDecimalNumber'
import { useLineChartPrice, useLineChartRelativeChange } from './usePrice'

export function PriceText({ loading }: { loading: boolean }): JSX.Element {
  const price = useLineChartPrice()
  const colors = useSporeColors()
  const currency = useAppFiatCurrency()
  const { decimalSeparator, symbolAtFront } = useAppFiatCurrencyInfo()

  // TODO gary re-enabling this for USD/Euros only, replace with more scalable approach
  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) &&
    symbolAtFront

  if (loading) {
    return <AnimatedText loading loadingPlaceholderText="$10,000" variant="heading1" />
  }

  return (
    <AnimatedDecimalNumber
      decimalPartColor={shouldFadePortfolioDecimals ? colors.neutral3.val : colors.neutral1.val}
      number={price}
      separator={decimalSeparator}
      testID="price-text"
      variant="heading1"
    />
  )
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
      <Flex mt={IS_ANDROID ? '$none' : '$spacing2'}>
        <AnimatedText loading loadingPlaceholderText="00.00%" variant="body1" />
      </Flex>
    )
  }

  return (
    <Flex
      row
      alignItems={IS_ANDROID ? 'center' : 'flex-end'}
      gap="$spacing2"
      mt={IS_ANDROID ? '$none' : '$spacing2'}>
      <Icons.AnimatedCaretChange
        size="$icon.16"
        strokeWidth={2}
        style={[
          caretStyle,
          // fix vertical centering
          // eslint-disable-next-line react-native/no-inline-styles
          { translateY: relativeChange.value.value > 0 ? -1 : 1 },
        ]}
      />
      <AnimatedText
        style={styles}
        testID="relative-change-text"
        text={relativeChange.formatted}
        variant="body1"
      />
    </Flex>
  )
}

export function DatetimeText({ loading }: { loading: boolean }): JSX.Element | null {
  const locale = useCurrentLocale()
  // `datetime` when scrubbing the chart
  const datetime = useLineChartDatetime({ locale })

  if (loading) return null

  return <AnimatedText color="$neutral2" text={datetime.formatted} variant="body1" />
}
