import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { buildGraph, GRAPH_PRECISION, takeSubset } from 'src/components/PriceChart/utils'
import { ChainId } from 'src/constants/chains'
import { useDailyTokenPricesQuery } from 'src/features/dataApi/slice'
import { logger } from 'src/utils/logger'

/**
 * @returns undefined if loading, null if error, `GraphMetadatas` otherwise
 */
export function useTokenPriceGraphs(token: Token): Nullable<GraphMetadatas> {
  const {
    currentData: dailyPrices,
    error,
    isLoading,
  } = useDailyTokenPricesQuery({
    address: token.address,
    chainId: token.chainId as ChainId,
  })

  return useMemo(() => {
    if (isLoading) {
      return undefined
    }

    if (!dailyPrices || error) {
      logger.debug('TokenModel', 'useTokenPriceGraphs', 'Historical prices error', error)
      return null
    }

    const graphs = [
      {
        label: '1H',
        index: 0,
        // TODO(MOB-1086): use hourly prices
        data: buildGraph(takeSubset(dailyPrices, 1), GRAPH_PRECISION),
      },
      {
        label: '1D',
        index: 0,
        data: buildGraph(takeSubset(dailyPrices, 1), GRAPH_PRECISION),
      },
      {
        label: '1W',
        index: 1,
        data: buildGraph(takeSubset(dailyPrices, 7), GRAPH_PRECISION),
      },
      {
        label: '1M',
        index: 2,
        data: buildGraph(takeSubset(dailyPrices, 30), GRAPH_PRECISION),
      },
      {
        label: '1Y',
        index: 3,
        data: buildGraph(takeSubset(dailyPrices, 365), GRAPH_PRECISION),
      },
    ] as const

    return graphs as GraphMetadatas
  }, [dailyPrices, error, isLoading])
}
