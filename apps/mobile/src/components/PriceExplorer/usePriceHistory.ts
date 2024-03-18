import { maxBy } from 'lodash'
import { Dispatch, SetStateAction, useCallback, useMemo, useRef, useState } from 'react'
import { SharedValue } from 'react-native-reanimated'
import { TLineChartData } from 'react-native-wagmi-charts'
import {
  HistoryDuration,
  TimestampedAmount,
  useTokenPriceHistoryQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

export type TokenSpotData = {
  value: SharedValue<number>
  relativeChange: SharedValue<number>
}

export type PriceNumberOfDigits = {
  left: number
  right: number
}

/**
 * @returns Token price history for requested duration
 */
export function useTokenPriceHistory(
  currencyId: string,
  onCompleted?: () => void,
  initialDuration: HistoryDuration = HistoryDuration.Day
): Omit<
  GqlResult<{
    priceHistory?: TLineChartData
    spot?: TokenSpotData
  }>,
  'error'
> & {
  setDuration: Dispatch<SetStateAction<HistoryDuration>>
  selectedDuration: HistoryDuration
  error: boolean
  numberOfDigits: PriceNumberOfDigits
} {
  const lastPrice = useRef<undefined | number>(undefined)
  const lastNumberOfDigits = useRef({
    left: 0,
    right: 0,
  })
  const [duration, setDuration] = useState(initialDuration)
  const { convertFiatAmount } = useLocalizationContext()

  const {
    data: priceData,
    refetch,
    networkStatus,
  } = useTokenPriceHistoryQuery({
    variables: {
      contract: currencyIdToContractInput(currencyId),
      duration,
    },
    notifyOnNetworkStatusChange: true,
    pollInterval: PollingInterval.Normal,
    onCompleted,
    // TODO(MOB-2308): maybe update to network-only once we have a better loading state
    fetchPolicy: 'cache-and-network',
  })

  const offChainData = priceData?.tokenProjects?.[0]?.markets?.[0]
  const onChainData = priceData?.tokenProjects?.[0]?.tokens?.[0]?.market

  const price = offChainData?.price?.value ?? onChainData?.price?.value ?? lastPrice.current
  lastPrice.current = price
  const priceHistory = offChainData?.priceHistory ?? onChainData?.priceHistory
  const pricePercentChange24h =
    offChainData?.pricePercentChange24h?.value ?? onChainData?.pricePercentChange24h?.value ?? 0

  const spot = useMemo(
    () =>
      price !== undefined
        ? {
            value: { value: price },
            relativeChange: { value: pricePercentChange24h },
          }
        : undefined,
    [price, pricePercentChange24h]
  )

  const formattedPriceHistory = useMemo(() => {
    const formatted = priceHistory
      ?.filter((x): x is TimestampedAmount => Boolean(x))
      .map((x) => ({ timestamp: x.timestamp * 1000, value: x.value }))

    return formatted
  }, [priceHistory])

  const numberOfDigits = useMemo(() => {
    const maxPriceInHistory = maxBy(priceHistory, 'value')?.value
    // If there is neither max price in history nor current price, return last number of digits
    if (!maxPriceInHistory && price === undefined) {
      return lastNumberOfDigits.current
    }
    const maxPrice = Math.max(maxPriceInHistory || 0, price || 0)
    const convertedMaxValue = convertFiatAmount(maxPrice).amount

    const newNumberOfDigits = {
      left: String(convertedMaxValue).split('.')[0]?.length || 10,
      right: Number(String(convertedMaxValue.toFixed(10)).split('.')[0]) > 0 ? 2 : 10,
    }
    lastNumberOfDigits.current = newNumberOfDigits

    return newNumberOfDigits
  }, [convertFiatAmount, priceHistory, price])

  const retry = useCallback(async () => {
    await refetch({ contract: currencyIdToContractInput(currencyId) })
  }, [refetch, currencyId])

  return useMemo(
    () => ({
      data: {
        priceHistory: formattedPriceHistory,
        spot,
      },
      loading: isNonPollingRequestInFlight(networkStatus),
      error: isError(networkStatus, !!priceData),
      refetch: retry,
      setDuration,
      selectedDuration: duration,
      numberOfDigits,
      onCompleted,
    }),
    [
      duration,
      formattedPriceHistory,
      networkStatus,
      priceData,
      retry,
      spot,
      onCompleted,
      numberOfDigits,
    ]
  )
}
