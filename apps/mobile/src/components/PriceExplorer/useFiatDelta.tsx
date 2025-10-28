import { useCallback, useMemo } from 'react'
import { runOnJS, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { useLineChart } from 'react-native-wagmi-charts'
import { useFormatChartFiatDelta } from 'uniswap/src/features/fiatCurrency/hooks/useFormatChartFiatDelta'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

interface UseFiatDeltaParams {
  startingPrice?: number
  shouldTreatAsStablecoin?: boolean
}

interface FiatDeltaResult {
  formatted: SharedValue<string>
}

/**
 * Hook to calculate and format fiat delta for price charts.
 * Optimized to only calculate deltas on-demand during scrubbing, reducing memory usage.
 */
export function useLineChartFiatDelta({
  startingPrice,
  shouldTreatAsStablecoin = false,
}: UseFiatDeltaParams): FiatDeltaResult {
  const { currentIndex, data, isActive } = useLineChart()
  const { conversionRate } = useLocalizationContext()
  const { formatChartFiatDelta } = useFormatChartFiatDelta()

  // Shared value for the current scrubbing delta
  const scrubbingDeltaSharedValue = useSharedValue('')

  // Pre-calculate only the last point's delta (for non-scrubbing state)
  const lastPointDelta = useMemo(() => {
    if (!startingPrice || !data || !conversionRate || data.length === 0) {
      return ''
    }

    const convertedStartPrice = startingPrice * conversionRate
    const lastPoint = data[data.length - 1]
    if (!lastPoint) {
      return ''
    }
    const convertedEndPrice = lastPoint.value * conversionRate

    const delta = formatChartFiatDelta({
      startingPrice: convertedStartPrice,
      endingPrice: convertedEndPrice,
      isStablecoin: shouldTreatAsStablecoin,
    })

    return delta.formatted
  }, [startingPrice, data, conversionRate, formatChartFiatDelta, shouldTreatAsStablecoin])

  // Calculate delta for current scrubbing position
  const calculateCurrentDelta = useMemo(() => {
    return (index: number) => {
      if (!startingPrice || !data || !conversionRate) {
        return ''
      }

      const currentPoint = data[index]
      if (!currentPoint) {
        return ''
      }

      const convertedStartPrice = startingPrice * conversionRate
      const convertedEndPrice = currentPoint.value * conversionRate

      const delta = formatChartFiatDelta({
        startingPrice: convertedStartPrice,
        endingPrice: convertedEndPrice,
        isStablecoin: shouldTreatAsStablecoin,
      })

      return delta.formatted
    }
  }, [startingPrice, data, conversionRate, formatChartFiatDelta, shouldTreatAsStablecoin])

  // Callback for updating the scrubbing delta from the UI thread
  const updateScrubbingDelta = useCallback(
    (index: number) => {
      scrubbingDeltaSharedValue.value = calculateCurrentDelta(index)
    },
    [calculateCurrentDelta],
  )

  // Track current index changes with useAnimatedReaction
  useAnimatedReaction(
    () => {
      return currentIndex.value
    },
    (currentIndexValue) => {
      if (data && data.length > 0) {
        const safeIndex = Math.min(Math.max(0, Math.round(currentIndexValue)), data.length - 1)
        runOnJS(updateScrubbingDelta)(safeIndex)
      }
    },
    [data, updateScrubbingDelta],
  )

  // Create a derived value that decides which delta to show
  const formatted = useDerivedValue(() => {
    if (!data || data.length === 0) {
      return ''
    }

    // When scrubbing, use the current scrubbing delta
    if (isActive.value) {
      return scrubbingDeltaSharedValue.value
    }

    // When not scrubbing, use the pre-calculated last point delta
    return lastPointDelta
  })

  return { formatted }
}
