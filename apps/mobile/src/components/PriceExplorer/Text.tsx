import { isAndroid } from '@universe/environment'
import { Flex, Text } from '@universe/mycelium'
import { Caret } from '@universe/mycelium/icons/Caret'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import React, { useEffect, useState } from 'react'
import Animated, {
  cancelAnimation,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { usePriceChart } from 'src/components/charts/PriceChartContext'
import { AnimatedDecimalNumber } from 'src/components/PriceExplorer/AnimatedDecimalNumber'
import { useLineChartFiatDelta } from 'src/components/PriceExplorer/useFiatDelta'
import { useLineChartPrice, useLineChartRelativeChange } from 'src/components/PriceExplorer/usePrice'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { numberToPercentWorklet } from 'src/utils/reanimated'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

type CaretTone = 'flat' | 'up' | 'down'

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
  spotRelativeChangeIdle,
  startingPrice,
  shouldTreatAsStablecoin = false,
}: {
  loading: boolean
  /** Price change for selected duration (used when not scrubbing chart) */
  spotRelativeChange?: SharedValue<number | undefined>
  /**
   * Plain JS mirror of `spotRelativeChange`, computed in the same render as `startingPrice` /
   * the fiat delta. Used (instead of bridging `spotRelativeChange` back from the UI thread) so
   * the idle fiat-amount-and-percent pair always update together on the same render — bridging
   * via `useAnimatedReaction` + `scheduleOnRN` adds an extra async hop that can leave the percent
   * lagging a frame or more behind the (synchronously computed) fiat amount, which is visible as
   * the amount updating immediately on a duration switch while the percent briefly — or, if
   * another update lands before the bridge fires, indefinitely — goes missing. See CONS-2883.
   */
  spotRelativeChangeIdle?: number
  startingPrice?: number
  shouldTreatAsStablecoin?: boolean
}): JSX.Element {
  const { isActive } = usePriceChart()

  // Bridge Reanimated isActive to React state so we can conditionally render AnimatedNumber
  const [isChartScrubbing, setIsChartScrubbing] = useState(false)
  useAnimatedReaction(
    () => isActive.value,
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setIsChartScrubbing, current)
      }
    },
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

  // Bridge the calculated caret tone to the JS thread only on change.
  const [caretTone, setCaretTone] = useState<CaretTone>('flat')
  useAnimatedReaction(
    () => {
      const absRelativeChange = Math.round(Math.abs(relativeChange.value) * 100)
      if (absRelativeChange === 0) {
        return 'flat'
      }
      return relativeChange.value > 0 ? 'up' : 'down'
    },
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setCaretTone, current)
      }
    },
  )

  const caretColor = caretTone === 'flat' ? '$neutral3' : caretTone === 'up' ? '$statusSuccess' : '$statusCritical'
  const caretDirection = caretTone === 'up' ? 'n' : 's'

  const relativeChangeFormatted = useDerivedValue(() => {
    if (shouldUseSpotData.value) {
      return spotRelativeChange?.value
        ? numberToPercentWorklet(spotRelativeChange.value, { precision: 2, absolute: true })
        : calculatedRelativeChange.formatted.value
    }
    return calculatedRelativeChange.formatted.value
  })

  // Combine fiat delta and percentage in a derived value
  const combinedText = useDerivedValue(() => {
    const delta = fiatDelta.formatted.value
    if (delta) {
      return `${delta} (${relativeChangeFormatted.value})`
    }
    return relativeChangeFormatted.value
  })

  // Bridge the worklet-computed string to plain React state so it renders through a normal
  // <Text> re-render, instead of imperatively setting it on a native TextInput via
  // `useAnimatedProps` (the AnimatedText/ReText pattern used below prior to this fix). That
  // imperative path bypasses RN's shadow-tree text measurement, so a change to a *longer* string
  // doesn't reliably trigger the surrounding flex container to re-measure/re-layout its width --
  // the container can stay sized to the previous, shorter string and the new text gets clipped at
  // that stale boundary. This matches a known, unresolved upstream RN issue on the New
  // Architecture (facebook/react-native#53125, "TextInput calculates incorrect width on dynamic
  // value change") and reproduces identically for both a duration switch (which can transiently
  // fall back to this branch while `spotRelativeChangeIdle` is undefined) and chart scrubbing
  // (which uses this branch for its whole duration). A plain React-state-driven <Text> always
  // gets a real measure+layout pass on every content change, so it cannot exhibit this clip. See
  // CONS-2883.
  const [combinedTextValue, setCombinedTextValue] = useState(() => combinedText.value)
  useAnimatedReaction(
    () => combinedText.value,
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setCombinedTextValue, current)
      }
    },
  )

  const showAnimatedNumber = !isChartScrubbing && !loading && spotRelativeChangeIdle !== undefined

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
            change={spotRelativeChangeIdle}
            color="$neutral2"
            variant="body1"
          />
        ) : (
          <Flex row alignItems="center" gap="$spacing2">
            <Caret color={caretColor} direction={caretDirection} size="$icon.16" />
            <Text testID="relative-change-text" variant="body1" color="$neutral2">
              {combinedTextValue}
            </Text>
          </Flex>
        )}
      </Animated.View>
    </Flex>
  )
}

export function DatetimeText({ loading }: { loading: boolean }): JSX.Element {
  const locale = useCurrentLocale()
  const { data, currentIndex } = usePriceChart()

  // `datetime` when scrubbing the chart
  const datetime = useDerivedValue(() => {
    if (currentIndex.value < 0) {
      return ''
    }
    const timestamp = data[currentIndex.value]?.timestamp
    return timestamp ? new Date(timestamp).toLocaleString(locale) : ''
  })

  return (
    <Flex alignItems="center" mt="$spacing12" style={{ opacity: loading ? 0 : 1 }}>
      <AnimatedText color="$neutral2" text={datetime} variant="body3" />
    </Flex>
  )
}
