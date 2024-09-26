import React from 'react'
import { useAnimatedStyle } from 'react-native-reanimated'
import { useLineChartDatetime } from 'react-native-wagmi-charts'
import { AnimatedDecimalNumber } from 'src/components/PriceExplorer/AnimatedDecimalNumber'
import { useLineChartPrice, useLineChartRelativeChange } from 'src/components/PriceExplorer/usePrice'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { Flex, useSporeColors } from 'ui/src'
import { AnimatedCaretChange } from 'ui/src/components/icons'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isAndroid } from 'utilities/src/platform'

export function PriceText({ maxWidth }: { loading: boolean; maxWidth?: number }): JSX.Element {
  const price = useLineChartPrice()
  const colors = useSporeColors()
  const currency = useAppFiatCurrency()
  const { decimalSeparator, symbolAtFront } = useAppFiatCurrencyInfo()

  // TODO gary re-enabling this for USD/Euros only, replace with more scalable approach
  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && symbolAtFront

  // TODO(MOB-2308): re-enable this when we have a better solution for handling the loading state
  // if (loading) {
  //   return <AnimatedText loading loadingPlaceholderText="$10,000" variant="heading1" />
  // }

  return (
    <AnimatedDecimalNumber
      decimalPartColor={shouldFadePortfolioDecimals ? colors.neutral3.val : colors.neutral1.val}
      maxWidth={maxWidth}
      number={price}
      separator={decimalSeparator}
      testID={TestID.PriceText}
      variant="heading1"
    />
  )
}

export function RelativeChangeText({ loading }: { loading: boolean }): JSX.Element {
  const colors = useSporeColors()

  const relativeChange = useLineChartRelativeChange()

  const styles = useAnimatedStyle(() => ({
    color: relativeChange.value.value > 0 ? colors.statusSuccess.val : colors.statusCritical.val,
  }))
  const caretStyle = useAnimatedStyle(() => ({
    color: relativeChange.value.value > 0 ? colors.statusSuccess.val : colors.statusCritical.val,
    transform: [{ rotate: relativeChange.value.value > 0 ? '180deg' : '0deg' }],
  }))

  if (loading) {
    return (
      <Flex mt={isAndroid ? '$none' : '$spacing2'}>
        <AnimatedText loading loadingPlaceholderText="00.00%" variant="body1" />
      </Flex>
    )
  }

  return (
    <Flex
      row
      alignItems={isAndroid ? 'center' : 'flex-end'}
      gap="$spacing2"
      mt={isAndroid ? '$none' : '$spacing2'}
      testID={TestID.RelativePriceChange}
    >
      <AnimatedCaretChange
        size="$icon.16"
        strokeWidth={2}
        style={[
          caretStyle,
          // fix vertical centering
          { translateY: relativeChange.value.value > 0 ? -1 : 1 },
        ]}
      />
      <AnimatedText style={styles} testID="relative-change-text" text={relativeChange.formatted} variant="body1" />
    </Flex>
  )
}

export function DatetimeText({ loading }: { loading: boolean }): JSX.Element | null {
  const locale = useCurrentLocale()
  // `datetime` when scrubbing the chart
  const datetime = useLineChartDatetime({ locale })

  if (loading) {
    return null
  }

  return (
    <Flex alignItems={isAndroid ? 'center' : 'flex-end'} gap="$spacing2" mt={isAndroid ? '$none' : '$spacing2'}>
      <AnimatedText color="$neutral2" text={datetime.formatted} variant="body1" />
    </Flex>
  )
}
