import { useCallback, useMemo } from 'react'
import { SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { usePriceChart } from 'src/components/charts/PriceChartContext'
import { useFormatChartFiatDelta } from 'uniswap/src/features/fiatCurrency/hooks/useFormatChartFiatDelta'

interface UseFiatDeltaParams {
  /** Already fiat-converted, like the context's chart data */
  startingPrice?: number
  shouldTreatAsStablecoin?: boolean
}

interface FiatDeltaResult {
  formatted: SharedValue<string>
  idleNumericDelta: number | undefined
}

/**
 * Hook to calculate and format fiat delta for price charts.
 * Optimized to only calculate deltas on-demand during scrubbing, reducing memory usage.
 */
export function useLineChartFiatDelta({
  startingPrice,
  shouldTreatAsStablecoin = false,
}: UseFiatDeltaParams): FiatDeltaResult {
  const { currentIndex, data, isActive } = usePriceChart()
  const { formatChartFiatDelta } = useFormatChartFiatDelta()

  // Shared value for the current scrubbing delta
  const scrubbingDeltaSharedValue = useSharedValue('')

  // Pre-calculate only the last point's delta (for non-scrubbing state)
  const lastPointDelta = useMemo(() => {
    if (!startingPrice || data.length === 0) {
      return { formatted: '', numericDelta: undefined }
    }

    const lastPoint = data[data.length - 1]
    if (!lastPoint) {
      return { formatted: '', numericDelta: undefined }
    }

    const delta = formatChartFiatDelta({
      startingPrice,
      endingPrice: lastPoint.value,
      isStablecoin: shouldTreatAsStablecoin,
    })

    return { formatted: delta.formatted, numericDelta: delta.rawDelta }
  }, [startingPrice, data, formatChartFiatDelta, shouldTreatAsStablecoin])

  // Calculate delta for current scrubbing position
  const calculateCurrentDelta = useMemo(() => {
    return (index: number) => {
      if (!startingPrice) {
        return ''
      }

      const currentPoint = data[index]
      if (!currentPoint) {
        return ''
      }

      const delta = formatChartFiatDelta({
        startingPrice,
        endingPrice: currentPoint.value,
        isStablecoin: shouldTreatAsStablecoin,
      })

      return delta.formatted
    }
  }, [startingPrice, data, formatChartFiatDelta, shouldTreatAsStablecoin])

  // Callback for updating the scrubbing delta from the UI thread
  const updateScrubbingDelta = useCallback(
    (index: number) => {
      scrubbingDeltaSharedValue.value = calculateCurrentDelta(index)
    },
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
    [calculateCurrentDelta],
  )

  // Track current index changes with useAnimatedReaction
  useAnimatedReaction(
    () => {
      return currentIndex.value
    },
    (currentIndexValue) => {
      if (data.length > 0) {
        const safeIndex = Math.min(Math.max(0, Math.round(currentIndexValue)), data.length - 1)
        scheduleOnRN(updateScrubbingDelta, safeIndex)
      }
    },
    [data, updateScrubbingDelta],
  )

  // Create a derived value that decides which delta to show
  const formatted = useDerivedValue(() => {
    if (data.length === 0) {
      return ''
    }

    // When scrubbing, use the current scrubbing delta
    if (isActive.value) {
      return scrubbingDeltaSharedValue.value
    }

    // When not scrubbing, use the pre-calculated last point delta
    return lastPointDelta.formatted
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- isActive and scrubbingDeltaSharedValue are Reanimated shared values tracked automatically
  }, [lastPointDelta, data])

  return { formatted, idleNumericDelta: lastPointDelta.numericDelta }
}
