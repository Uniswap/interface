import { SharedValue, useDerivedValue } from 'react-native-reanimated'
import {
  useLineChart,
  useLineChartPrice as useRNWagmiChartLineChartPrice,
} from 'react-native-wagmi-charts'
import { numberToLocaleStringWorklet, numberToPercentWorklet } from 'src/utils/reanimated'

export type ValueAndFormatted<U = number, V = string> = {
  value: Readonly<SharedValue<U>>
  formatted: Readonly<SharedValue<V>>
}

/**
 * Wrapper around react-native-wagmi-chart#useLineChartPrice that returns price
 * when not scrubbing.
 */
export function useLineChartPrice({ spotPrice }: { spotPrice?: number }): ValueAndFormatted {
  // `price` when scrubbing the chart
  const { value: activeCursorPrice } = useRNWagmiChartLineChartPrice({
    // do not round
    precision: 18,
  })

  const price = useDerivedValue(() => {
    if (activeCursorPrice.value) {
      return Number(activeCursorPrice.value)
    }

    return spotPrice ?? 0
  })

  const priceFormatted = useDerivedValue(() => {
    return numberToLocaleStringWorklet(price.value, 'en-US', {
      style: 'currency',
      currency: 'USD',
    })
  })

  return {
    value: price,
    formatted: priceFormatted,
  }
}

export function useLineChartRelativeChange({
  spotRelativeChange,
}: {
  spotRelativeChange?: number
}): ValueAndFormatted {
  const { currentIndex, data, isActive } = useLineChart()

  const relativeChange = useDerivedValue(() => {
    // when not scrubbing, return relative change 24h
    if (!isActive.value) {
      return spotRelativeChange ?? 0
    }

    // when scrubbing, compute relative change from close price
    const activePrice = data[currentIndex.value]?.value
    const closePrice = data[data.length - 1]?.value

    if (!activePrice || !closePrice) {
      return 0
    }

    return ((activePrice - closePrice) / closePrice) * 100
  })

  const relativeChangeFormattted = useDerivedValue(() => {
    return numberToPercentWorklet(relativeChange.value, { precision: 2, absolute: true })
  })

  return { value: relativeChange, formatted: relativeChangeFormattted }
}
