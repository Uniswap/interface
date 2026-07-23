import { isAndroid } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useEffect, useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useLineChart, useLineChartDatetime } from 'react-native-wagmi-charts'
import { AnimatedDecimalNumber } from 'src/components/PriceExplorer/AnimatedDecimalNumber'
import { useLineChartFiatDelta } from 'src/components/PriceExplorer/useFiatDelta'
import { useLineChartPrice, useLineChartRelativeChange } from 'src/components/PriceExplorer/usePrice'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { numberToPercentWorklet } from 'src/utils/reanimated'
import { Flex, Text, useSporeColors } from 'ui/src'
import { AnimatedCaretChange } from 'ui/src/components/icons'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
  spotRelativeChange,
  startingPrice,
  shouldTreatAsStablecoin = false,
}: {
  loading: boolean
  /** Price change for selected duration (used when not scrubbing chart) */
  spotRelativeChange?: SharedValue<number | undefined>
  startingPrice?: number
  shouldTreatAsStablecoin?: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const { isActive } = useLineChart()
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  // Bridge Reanimated isActive to React state so we can conditionally render AnimatedNumber
  const [isChartScrubbing, setIsChartScrubbing] = useState(false)
  useAnimatedReaction(
    () => isActive.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setIsChartScrubbing)(current)
      }
    },
  )

  // Bridge spotRelativeChange to React state for AnimatedNumber's numericValue
  const [idleChangePercent, setIdleChangePercent] = useState<number | undefined>(undefined)
  useAnimatedReaction(
    () => spotRelativeChange?.value,
    (current, previous) => {
      if (current !== previous && current !== undefined) {
        runOnJS(setIdleChangePercent)(current)
      }
    },
    [spotRelativeChange],
  )

  // Calculate relative change from chart data (used when scrubbing)
  const calculatedRelativeChange = useLineChartRelativeChange()

  const fiatDelta = useLineChartFiatDelta({
    startingPrice,
    shouldTreatAsStablecoin,
  })

  // Decide which source to use: API's 24hr when idle, chart's when scrubbing
  // This ensures the color shows immediately with correct API data
  const hasSpotData = !!spotRelativeChange
  const shouldUseSpotData = useDerivedValue(() => !isActive.value && hasSpotData)

  const relativeChange = useDerivedValue(() => {
    return shouldUseSpotData.value
      ? (spotRelativeChange?.value ?? calculatedRelativeChange.value.value)
      : calculatedRelativeChange.value.value
  })

  const relativeChangeFormatted = useDerivedValue(() => {
    if (shouldUseSpotData.value) {
      return spotRelativeChange?.value
        ? numberToPercentWorklet(spotRelativeChange.value, { precision: 2, absolute: true })
        : calculatedRelativeChange.formatted.value
    }
    return calculatedRelativeChange.formatted.value
  })

  const changeColor = useDerivedValue(() => {
    // Round the range to 2 decimal places to check if is equal to 0
    const absRelativeChange = Math.round(Math.abs(relativeChange.value) * 100)
    if (absRelativeChange === 0) {
      return colors.neutral3.val
    }
    return relativeChange.value > 0 ? colors.statusSuccess.val : colors.statusCritical.val
  })

  // reanimated 4 returns an AnimatedStyleHandle, accepted by the animated icon at runtime.
  const caretStyle = useAnimatedStyle(() => ({
    color: changeColor.value,
    transform: [
      { rotate: relativeChange.value >= 0 ? '180deg' : '0deg' },
      // fix vertical centering
      { translateY: relativeChange.value >= 0 ? -1 : 1 },
    ],
  })) as unknown as StyleProp<ViewStyle>

  // Combine fiat delta and percentage in a derived value
  const combinedText = useDerivedValue(() => {
    const delta = fiatDelta.formatted.value
    if (delta) {
      return `${delta} (${relativeChangeFormatted.value})`
    }
    return relativeChangeFormatted.value
  })

  const showAnimatedNumber = isDataLivelinessEnabled && !isChartScrubbing && !loading && idleChangePercent !== undefined

  // Shared value for fade-in animation; always start hidden since the component always mounts with loading=true
  const contentOpacity = useSharedValue(0)

  useEffect(() => {
    if (!loading) {
      contentOpacity.value = withTiming(1, { duration: 200 })
    } else {
      cancelAnimation(contentOpacity)
      contentOpacity.value = 0
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [loading])

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing2"
      mt={isAndroid ? '$none' : '$spacing2'}
      testID={TestID.RelativePriceChange}
    >
      {loading && (
        // We use `no-shimmer` here to speed up the first render and so that this skeleton renders
        // at the exact same time as the animated number skeleton.
        // TODO(WALL-5215): we can remove `no-shimmer` once we have a better Skeleton component.
        <Text loading="no-shimmer" loadingPlaceholderText="00.00%" variant="body1" />
      )}
      {/* Always mount this content to avoid stale values on initial render (new arch); fade in once loaded */}
      <Animated.View style={animatedContentStyle}>
        {showAnimatedNumber ? (
          <RelativeChange
            shouldAnimate
            absoluteChange={fiatDelta.idleNumericDelta}
            change={idleChangePercent}
            color="$neutral2"
            variant="body1"
          />
        ) : (
          <Flex row alignItems="center" gap="$spacing2">
            <AnimatedCaretChange size="$icon.16" strokeWidth={2} style={caretStyle} />
            <AnimatedText testID="relative-change-text" text={combinedText} variant="body1" color="$neutral2" />
          </Flex>
        )}
      </Animated.View>
    </Flex>
  )
}

export function DatetimeText({ loading }: { loading: boolean }): JSX.Element {
  const locale = useCurrentLocale()
  // `datetime` when scrubbing the chart
  const datetime = useLineChartDatetime({ locale })

  return (
    <Flex alignItems="center" mt="$spacing12" style={{ opacity: loading ? 0 : 1 }}>
      <AnimatedText color="$neutral2" text={datetime.formatted} variant="body3" />
    </Flex>
  )
}
