import maxBy from 'lodash/maxBy'
import { type Dispatch, type SetStateAction, useMemo, useRef, useState } from 'react'
import { type SharedValue, useDerivedValue } from 'react-native-reanimated'
import { type ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import { appendLiveSpotPriceEntry } from 'uniswap/src/components/charts/utils'
import { useTokenPriceChange, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenPriceHistoryRest } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export type TokenSpotData = {
  value: SharedValue<number>
  relativeChange: SharedValue<number | undefined>
  /**
   * Plain JS mirror of `relativeChange`, computed in the same render as the fiat delta.
   * Consumers that need the idle (non-scrubbing) percent change synchronously alongside other
   * JS-thread-derived values (e.g. the fiat delta amount) should use this instead of bridging
   * `relativeChange` back from the UI thread via `useAnimatedReaction` — that bridge is an extra
   * async hop that can lag a frame or more behind values computed directly from `priceChange`,
   * producing a visibly "torn" render where the fiat amount updates before the percent does.
   */
  relativeChangeIdle: number | undefined
}

export type PriceNumberOfDigits = {
  left: number
  right: number
}

type ConvertFiatAmount = ReturnType<typeof useLocalizationContext>['convertFiatAmount']

/** Accepts either the GraphQL-shaped entries or the shared REST hook's RestPriceHistoryPoint[]. */
type PriceValueEntries = readonly ({ value: number } | null | undefined)[] | undefined

function calculatePriceChange(priceHistory: PriceValueEntries): number | undefined {
  if (!priceHistory || priceHistory.length === 0) {
    return undefined
  }
  const openPrice = priceHistory[0]?.value
  const closePrice = priceHistory[priceHistory.length - 1]?.value
  if (openPrice === undefined || closePrice === undefined || openPrice === 0) {
    return undefined
  }
  return ((closePrice - openPrice) / openPrice) * 100
}

function getNumberOfDigits({
  convertFiatAmount,
  lastNumberOfDigits,
  price,
  priceHistory,
}: {
  convertFiatAmount: ConvertFiatAmount
  lastNumberOfDigits: PriceNumberOfDigits
  price: number | undefined
  priceHistory: PriceValueEntries
}): PriceNumberOfDigits {
  const maxPriceInHistory = maxBy(priceHistory, 'value')?.value
  if (!maxPriceInHistory && price === undefined) {
    return lastNumberOfDigits
  }

  const maxPrice = Math.max(maxPriceInHistory || 0, price || 0)
  const convertedMaxValue = convertFiatAmount(maxPrice).amount

  return {
    left: String(convertedMaxValue).split('.')[0]?.length || 10,
    right: Number(String(convertedMaxValue.toFixed(16)).split('.')[0]) > 0 ? 2 : 16,
  }
}

/**
 * @returns Token price history for requested duration
 */
export function useTokenPriceHistory({
  currencyId,
  initialDuration = HistoryDuration.Day,
  isMultichainAggregateView = false,
  skip = false,
}: {
  currencyId: string
  initialDuration?: HistoryDuration
  isMultichainAggregateView?: boolean
  skip?: boolean
}): Omit<
  DerivedQueryResult<{
    priceHistory?: ChartPoint[]
    spot?: TokenSpotData
  }>,
  'error' | 'refetch'
> & {
  setDuration: Dispatch<SetStateAction<HistoryDuration>>
  selectedDuration: HistoryDuration
  numberOfDigits: PriceNumberOfDigits
} {
  const lastPrice = useRef<undefined | number>(undefined)
  const lastNumberOfDigits = useRef({
    left: 0,
    right: 0,
  })
  const [duration, setDuration] = useState(initialDuration)
  const { convertFiatAmount } = useLocalizationContext()
  const restSpotPrice = useTokenSpotPrice(currencyId, { isMultichainAggregateView })
  const restPriceChange24h = useTokenPriceChange(currencyId, { isMultichainAggregateView })
  // Once on, the chart line also comes from REST instead of this hook's own GraphQL query.
  const restPriceHistory = useTokenPriceHistoryRest(currencyId, {
    duration,
    isMultichainAggregateView,
  })

  const price = restSpotPrice ?? lastPrice.current
  lastPrice.current = price

  const activeEntries = useMemo(
    () => [...restPriceHistory.entries].sort((a, b) => a.timestamp - b.timestamp),
    [restPriceHistory.entries],
  )
  const calculatedPriceChange = useMemo(() => calculatePriceChange(activeEntries), [activeEntries])

  // Use API's 24hr change for 1d, calculated change for other durations
  const apiPriceChange24h = restPriceChange24h ?? 0
  const priceChange = duration === HistoryDuration.Day ? apiPriceChange24h : calculatedPriceChange

  const spotValue = useDerivedValue(() => price ?? 0)
  const spotRelativeChange = useDerivedValue(() => priceChange, [priceChange])

  const spot = useMemo(
    () =>
      price !== undefined
        ? {
            value: spotValue,
            relativeChange: spotRelativeChange,
            relativeChangeIdle: priceChange,
          }
        : undefined,
    [price, priceChange, spotValue, spotRelativeChange],
  )

  const formattedPriceHistory = useMemo(() => {
    // the chart expects milliseconds.
    const formatted = activeEntries.map((point) => ({
      timestamp: point.timestamp * ONE_SECOND_MS,
      value: point.value,
    }))

    // Extends the chart line to the current spot price between backend refetches, matching web's behavior.
    return appendLiveSpotPriceEntry<ChartPoint>({
      entries: formatted,
      currentPrice: price,
      now: Date.now(),
      getTime: (entry) => entry.timestamp,
      createEntry: ({ time, price: entryPrice }) => ({ timestamp: time, value: entryPrice }),
      updateEntry: (entry, { time, price: entryPrice }) => ({ ...entry, timestamp: time, value: entryPrice }),
    })
  }, [activeEntries, price])

  const data = useMemo(
    () => ({
      priceHistory: formattedPriceHistory,
      spot,
    }),
    [formattedPriceHistory, spot],
  )

  const numberOfDigits = useMemo(() => {
    const newNumberOfDigits = getNumberOfDigits({
      convertFiatAmount,
      lastNumberOfDigits: lastNumberOfDigits.current,
      price,
      priceHistory: activeEntries,
    })
    lastNumberOfDigits.current = newNumberOfDigits

    return newNumberOfDigits
  }, [convertFiatAmount, activeEntries, price])

  return {
    data,
    isLoading: skip || restPriceHistory.isLoading,
    setDuration,
    selectedDuration: duration,
    numberOfDigits,
  }
}
