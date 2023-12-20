import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { SharedValue } from 'react-native-reanimated'
import { TLineChartData } from 'react-native-wagmi-charts'
import { GqlResult } from 'src/features/dataApi/types'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import {
  HistoryDuration,
  TimestampedAmount,
  useTokenPriceHistoryQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'

export type TokenSpotData = {
  value: SharedValue<number>
  relativeChange: SharedValue<number>
}

/**
 * @returns Token price history for requested duration
 */
export function useTokenPriceHistory(
  currencyId: string,
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
} {
  const [duration, setDuration] = useState(initialDuration)

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
    fetchPolicy: 'cache-first',
  })

  const offChainData = priceData?.tokenProjects?.[0]?.markets?.[0]
  const onChainData = priceData?.tokenProjects?.[0]?.tokens?.[0]?.market

  const price = offChainData?.price?.value ?? onChainData?.price?.value
  const priceHistory = offChainData?.priceHistory ?? onChainData?.priceHistory
  const pricePercentChange24h =
    offChainData?.pricePercentChange24h?.value ?? onChainData?.pricePercentChange24h?.value ?? 0

  const spot = useMemo(
    () =>
      price
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

    // adds the current price to the chart given we show spot price/24h change
    if (formatted && spot?.value) {
      formatted?.push({ timestamp: Date.now(), value: spot.value.value })
    }

    return formatted
  }, [priceHistory, spot?.value])

  const retry = useCallback(async () => {
    await refetch({ contract: currencyIdToContractInput(currencyId) })
  }, [refetch, currencyId])

  return useMemo(
    () => ({
      data: {
        priceHistory: formattedPriceHistory,
        spot: duration === HistoryDuration.Day ? spot : undefined,
      },
      loading: isNonPollingRequestInFlight(networkStatus),
      error: isError(networkStatus, !!priceData),
      refetch: retry,
      setDuration,
      selectedDuration: duration,
    }),
    [duration, formattedPriceHistory, networkStatus, priceData, retry, spot]
  )
}
