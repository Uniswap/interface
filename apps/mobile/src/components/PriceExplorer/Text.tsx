import React from 'react'
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { useLineChartDatetime } from 'react-native-wagmi-charts'
import { AnimatedDecimalNumber } from 'src/components/PriceExplorer/AnimatedDecimalNumber'
import { useLineChartFiatDelta } from 'src/components/PriceExplorer/useFiatDelta'
import { useLineChartPrice, useLineChartRelativeChange } from 'src/components/PriceExplorer/usePrice'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { Flex, Text, useSporeColors } from 'ui/src'
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

export function RelativeChangeText({
  loading,
  startingPrice,
  shouldTreatAsStablecoin = false,
}: {
  loading: boolean
  startingPrice?: number
  shouldTreatAsStablecoin?: boolean
}): JSX.Element {
  const colors = useSporeColors()

  const relativeChange = useLineChartRelativeChange()
  const fiatDelta = useLineChartFiatDelta({
    startingPrice,
    shouldTreatAsStablecoin,
  })

  const changeColor = useDerivedValue(() => {
    if (relativeChange.value.value === 0) {
      return colors.neutral3.val
    }
    return relativeChange.value.value > 0 ? colors.statusSuccess.val : colors.statusCritical.val
  })

  const styles = useAnimatedStyle(() => ({
    color: changeColor.value,
  }))
  const caretStyle = useAnimatedStyle(() => ({
    color: changeColor.value,
    transform: [{ rotate: relativeChange.value.value >= 0 ? '180deg' : '0deg' }],
  }))

  // Combine fiat delta and percentage in a derived value
  const combinedText = useDerivedValue(() => {
    const delta = fiatDelta.formatted.value
    if (delta) {
      return `${delta} (${relativeChange.formatted.value})`
    }
    return relativeChange.formatted.value
  })

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing2"
      mt={isAndroid ? '$none' : '$spacing2'}
      testID={TestID.RelativePriceChange}
    >
      {loading ? (
        // We use `no-shimmer` here to speed up the first render and so that this skeleton renders
        // at the exact same time as the animated number skeleton.
        // TODO(WALL-5215): we can remove `no-shimmer` once we have a better Skeleton component.
        <Text loading="no-shimmer" loadingPlaceholderText="00.00%" variant="body1" />
      ) : (
        <>
          <AnimatedCaretChange
            size="$icon.16"
            strokeWidth={2}
            style={[
              caretStyle,
              // fix vertical centering
              { translateY: relativeChange.value.value >= 0 ? -1 : 1 },
            ]}
          />
          <AnimatedText style={styles} testID="relative-change-text" text={combinedText} variant="body1" />
        </>
      )}
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
    <Flex alignItems="center" mt="$spacing12">
      <AnimatedText color="$neutral2" text={datetime.formatted} variant="body3" />
    </Flex>
  )
}
