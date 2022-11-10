import { Token } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { PriceChartLabel } from 'src/components/PriceChart/PriceChartLabels'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { buildGraph, GRAPH_PRECISION } from 'src/components/PriceChart/utils'
import { PollingInterval } from 'src/constants/misc'
import { useTokenPriceChartsQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { currencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

export function useTokenPriceGraphs(token: Token): GqlResult<GraphMetadatas> {
  const {
    data: priceData,
    loading,
    error,
    refetch,
  } = useTokenPriceChartsQuery({
    variables: {
      contract: currencyIdToContractInput(currencyId(token)),
    },
    pollInterval: PollingInterval.Normal,
  })

  const retry = useCallback(() => {
    refetch({ contract: currencyIdToContractInput(currencyId(token)) })
  }, [refetch, token])

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
      logger.debug('TokenModel', 'useTokenPriceGraphs', 'Token prices error')
      return
    }

    const graphs = [
      {
        label: PriceChartLabel.Hour,
        index: 0,
        data: buildGraph([...priceHistory1H].reverse() as any, GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Day,
        index: 1,
        data: buildGraph([...priceHistory1D].reverse() as any, GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Week,
        index: 2,
        data: buildGraph([...priceHistory1W].reverse() as any, GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Month,
        index: 3,
        data: buildGraph([...priceHistory1M].reverse() as any, GRAPH_PRECISION),
      },
      {
        label: PriceChartLabel.Year,
        index: 4,
        data: buildGraph([...priceHistory1Y].reverse() as any, GRAPH_PRECISION),
      },
    ] as const

    return graphs as GraphMetadatas
  }, [priceData])

  return { data: formattedData, loading, error, refetch: retry }
}
