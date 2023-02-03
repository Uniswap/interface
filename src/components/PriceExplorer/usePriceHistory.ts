import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { TLineChartData } from 'react-native-wagmi-charts'
import { PollingInterval } from 'src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'src/data/utils'
import {
  HistoryDuration,
  TimestampedAmount,
  useTokenPriceHistoryQuery,
} from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'

/**
 * @returns Token price history for requested duration
 */
export function useTokenPriceHistory(
  currencyId: string,
  initialDuration: HistoryDuration = HistoryDuration.Day
): Omit<
  GqlResult<{ priceHistory?: TLineChartData; spot: { value?: number; relativeChange?: number } }>,
  'error'
> & {
  setDuration: Dispatch<SetStateAction<HistoryDuration>>
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

  const retry = useCallback(() => {
    refetch({ contract: currencyIdToContractInput(currencyId) })
  }, [refetch, currencyId])

  const { price, pricePercentChange24h, priceHistory } =
    priceData?.tokenProjects?.[0]?.markets?.[0] ?? {}
  const formattedPriceHistory = useMemo(
    () =>
      priceHistory
        ?.filter((x): x is TimestampedAmount => Boolean(x))
        .map((x) => ({ timestamp: x.timestamp * 1000, value: x.value })),
    [priceHistory]
  )
  const spot = useMemo(
    () => ({
      value: price?.value,
      relativeChange: pricePercentChange24h?.value,
    }),
    [price?.value, pricePercentChange24h?.value]
  )

  return useMemo(
    () => ({
      data: { priceHistory: formattedPriceHistory, spot },
      loading: isNonPollingRequestInFlight(networkStatus),
      error: isError(networkStatus, !!priceData),
      refetch: retry,
      setDuration,
    }),
    [formattedPriceHistory, networkStatus, priceData, retry, spot]
  )
}
