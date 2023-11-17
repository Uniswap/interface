import { SharedValue, useDerivedValue } from 'react-native-reanimated'
import {
  useLineChart,
  useLineChartPrice as useRNWagmiChartLineChartPrice,
} from 'react-native-wagmi-charts'
import { numberToLocaleStringWorklet, numberToPercentWorklet } from 'src/utils/reanimated'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'wallet/src/features/language/hooks'

export type ValueAndFormatted<U = number, V = string> = {
  value: Readonly<SharedValue<U>>
  formatted: Readonly<SharedValue<V>>
}

/**
 * Wrapper around react-native-wagmi-chart#useLineChartPrice
 * @returns latest price when not scrubbing and active price when scrubbing
 */
export function useLineChartPrice(): ValueAndFormatted {
  const { value: activeCursorPrice } = useRNWagmiChartLineChartPrice({
    // do not round
    precision: 18,
  })
  const { data } = useLineChart()
  const currencyInfo = useAppFiatCurrencyInfo()
  const locale = useCurrentLocale()

  const price = useDerivedValue(() => {
    if (activeCursorPrice.value) {
      // active price when scrubbing the chart
      return Number(activeCursorPrice.value)
    }

    return data[data.length - 1]?.value ?? 0
  })
  const priceFormatted = useDerivedValue(() => {
    return numberToLocaleStringWorklet(
      price.value,
      locale,
      {
        style: 'currency',
        currency: currencyInfo.code,
      },
      currencyInfo.symbol
    )
  })
  return {
    value: price,
    formatted: priceFormatted,
  }
}

/**
 * @returns % change for the active history duration when not scrubbing and %
 *          change between active index and period start when scrubbing
 */
export function useLineChartRelativeChange({
  spotRelativeChange,
}: {
  spotRelativeChange?: SharedValue<number>
}): ValueAndFormatted {
  const { currentIndex, data, isActive } = useLineChart()

  const relativeChange = useDerivedValue(() => {
    if (!isActive.value && Boolean(spotRelativeChange)) {
      // break early when chart is not active (scrubbing) and spot relative
      // change is available
      // this should only happen for the daily HistoryDuration where calculating
      // relative change from historical data leads to data inconsistencies in
      // the ui
      return spotRelativeChange?.value ?? 0
    }

    // when scrubbing, compute relative change from open price
    const openPrice = data[0]?.value

    // scrubbing: close price is active price
    // not scrubbing: close price is period end price
    const closePrice = isActive.value
      ? data[currentIndex.value]?.value
      : data[data.length - 1]?.value

    if (openPrice === undefined || closePrice === undefined || openPrice === 0) {
      return 0
    }

    const change = ((closePrice - openPrice) / openPrice) * 100

    return change
  })

  const relativeChangeFormattted = useDerivedValue(() => {
    return numberToPercentWorklet(relativeChange.value, { precision: 2, absolute: true })
  })

  return { value: relativeChange, formatted: relativeChangeFormattted }
}
