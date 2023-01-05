import { useCallback, useMemo } from 'react'
import { PriceChartLabel } from 'src/components/PriceChart/PriceChartLabels'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { buildGraph, GRAPH_PRECISION } from 'src/components/PriceChart/utils'
import { PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useTokenPriceChartsQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { logger } from 'src/utils/logger'

export function useTokenPriceGraphs(currencyId: string): GqlResult<GraphMetadatas> {
  const {
    data: priceData,
    refetch,
    networkStatus,
    error,
  } = useTokenPriceChartsQuery({
    variables: {
      contract: currencyIdToContractInput(currencyId),
    },
    notifyOnNetworkStatusChange: true,
    pollInterval: PollingInterval.Normal,
  })

  const retry = useCallback(() => {
    refetch({ contract: currencyIdToContractInput(currencyId) })
  }, [refetch, currencyId])

  const formattedData = useMemo(() => {
    if (!priceData) {
      return
    }

    const { priceHistory1H, priceHistory1D, priceHistory1W, priceHistory1M, priceHistory1Y } =
      priceData.tokenProjects?.[0]?.markets?.[0] ?? {}

    if (
      !priceHistory1H ||
      !priceHistory1D ||
      !priceHistory1W ||
      !priceHistory1M ||
      !priceHistory1Y
    ) {
      logger.debug('TokenModel', 'useTokenPriceGraphs', 'Token price history error')
      return
    }

    const graphs = [
      {
        label: PriceChartLabel.Hour,
        index: 0,
        data: buildGraph([...priceHistory1H].reverse(), GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Day,
        index: 1,
        data: buildGraph([...priceHistory1D].reverse(), GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Week,
        index: 2,
        data: buildGraph([...priceHistory1W].reverse(), GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Month,
        index: 3,
        data: buildGraph([...priceHistory1M].reverse(), GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Year,
        index: 4,
        data: buildGraph([...priceHistory1Y].reverse(), GRAPH_PRECISION),
      },
    ] as const

    // ensures every graph was successfully loaded
    if (graphs.some((graph) => !graph.data)) {
      return
    }

    return graphs as GraphMetadatas
  }, [priceData])

  return {
    data: formattedData,
    loading: isNonPollingRequestInFlight(networkStatus),
    error,
    refetch: retry,
  }
}
