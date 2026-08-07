import { useMemo } from 'react'
import { SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { usePriceChart } from 'src/components/charts/PriceChartContext'
import { numberToLocaleStringWorklet, numberToPercentWorklet } from 'src/utils/reanimated'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

export type ValueAndFormatted = {
  value: Readonly<SharedValue<number>>
  formatted: Readonly<SharedValue<string>>
}

export type ValueAndFormattedWithAnimation = ValueAndFormatted & {
  shouldAnimate: Readonly<SharedValue<boolean>>
}

/**
 * @returns latest price when not scrubbing and active price when scrubbing
 */
export function useLineChartPrice(currentSpot?: SharedValue<number>): ValueAndFormattedWithAnimation {
  const { data, currentIndex, isActive } = usePriceChart()
  const shouldAnimate = useSharedValue(true)

  // active price when scrubbing the chart
  const activeCursorPrice = useDerivedValue(() => {
    if (!isActive.value || currentIndex.value < 0 || data.length === 0) {
      return undefined
    }
    return data[Math.min(currentIndex.value, data.length - 1)]?.value
  })

  useAnimatedReaction(
    () => {
      return activeCursorPrice.value
    },
    (currentValue, previousValue) => {
      if (previousValue && currentValue && shouldAnimate.value) {
        shouldAnimate.value = false
      }
    },
  )
  const currencyInfo = useAppFiatCurrencyInfo()
  const locale = useCurrentLocale()

  const price = useDerivedValue(() => {
    if (activeCursorPrice.value) {
      return activeCursorPrice.value
    }

    shouldAnimate.value = true
    // show spot price when chart not scrubbing, or if not available, show the last price in the chart
    return currentSpot?.value ?? data[data.length - 1]?.value ?? 0
  })
  const priceFormatted = useDerivedValue(() => {
    const { symbol, code } = currencyInfo
    return numberToLocaleStringWorklet({
      value: price.value,
      locale,
      options: {
        style: 'currency',
        currency: code,
      },
      symbol,
    })
  })

  return useMemo(
    () => ({
      value: price,
      formatted: priceFormatted,
      shouldAnimate,
    }),
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
    [],
  )
}

/**
 * @returns % change for the active history duration when not scrubbing and %
 *          change between active index and period start when scrubbing
 */
export function useLineChartRelativeChange(): ValueAndFormatted {
  const { currentIndex, data, isActive } = usePriceChart()

  const relativeChange = useDerivedValue(() => {
    if (data.length === 0) {
      return 0
    }

    // when scrubbing, compute relative change from open price
    const openPrice = data[0]?.value

    // scrubbing: close price is active price
    // not scrubbing: close price is period end price
    const closePrice = isActive.value ? data[currentIndex.value]?.value : data[data.length - 1]?.value

    if (openPrice === undefined || closePrice === undefined || openPrice === 0) {
      return 0
    }

    const change = ((closePrice - openPrice) / openPrice) * 100

    return change
  })

  const relativeChangeFormatted = useDerivedValue(() => {
    return numberToPercentWorklet(relativeChange.value, { precision: 2, absolute: true })
  })

  return { value: relativeChange, formatted: relativeChangeFormatted }
}
