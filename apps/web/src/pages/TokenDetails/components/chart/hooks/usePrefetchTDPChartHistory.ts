import { useQueryClient } from '@tanstack/react-query'
import {
  getGetTokenHistoryOHLCQueryOptions,
  getGetTokenHistoryTVLQueryOptions,
  getGetTokenHistoryVolumeQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { useEvent } from 'utilities/src/react/hooks'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod, toHistoryDuration } from '~/data/util'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import type { TDPChartQueryVariables, TokenDetailsChartType } from '~/pages/TokenDetails/components/chart/TDPChartState'
import { getTdpTokenPriceHistoryQueryOptions } from '~/pages/TokenDetails/tdpTokenQueryOptions'

/**
 * Warms the hovered time period's history query for the active chart so selecting it paints from
 * cache. Keys come from the same builders the panel hooks read through, so a warmed key can't drift
 * from the one the panel requests.
 */
export function usePrefetchTDPChartHistory({
  variables,
  chartType,
  displayPriceChartType,
}: {
  variables: TDPChartQueryVariables
  chartType: TokenDetailsChartType
  displayPriceChartType: PriceChartType
}): (timePeriod: TimePeriod) => void {
  const queryClient = useQueryClient()
  const target = useRestHistoryTarget(variables)

  return useEvent((timePeriod: TimePeriod) => {
    const duration = toHistoryDuration(timePeriod)
    if (!target || duration === variables.duration) {
      return
    }
    const params = { target, duration: toRestHistoryDuration(duration) }
    switch (chartType) {
      case ChartType.VOLUME:
        void queryClient.prefetchQuery(getGetTokenHistoryVolumeQueryOptions({ params }))
        break
      case ChartType.TVL:
        void queryClient.prefetchQuery(getGetTokenHistoryTVLQueryOptions({ params }))
        break
      case ChartType.PRICE:
        if (displayPriceChartType === PriceChartType.CANDLESTICK) {
          void queryClient.prefetchQuery(getGetTokenHistoryOHLCQueryOptions({ params }))
        } else {
          void queryClient.prefetchQuery(getTdpTokenPriceHistoryQueryOptions({ target, duration }))
        }
        break
    }
  })
}
