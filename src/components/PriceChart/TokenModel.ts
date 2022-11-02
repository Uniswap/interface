import { Token } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { PriceChartLabel } from 'src/components/PriceChart/PriceChartLabels'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { buildGraph, GRAPH_PRECISION } from 'src/components/PriceChart/utils'
import { TokenModel_PriceQuery } from 'src/components/PriceChart/__generated__/TokenModel_PriceQuery.graphql'
import { PollingInterval } from 'src/constants/misc'
import { toGraphQLChain } from 'src/utils/chainId'
import { graphQLCurrencyInfo } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

const priceQuery = graphql`
  query TokenModel_PriceQuery($contract: ContractInput!) {
    tokenProjects(contracts: [$contract]) {
      name
      markets(currencies: [USD]) {
        # Data supported for all durations
        # - HOUR: 5m interval data
        # - DAY: 5m interval data
        # - WEEK: hourly interval data
        # - MONTH: hourly interval data
        # - YEAR: daily interval data
        # - MAX: 5m/hourly/daily depending on history duration
        priceHistory1H: priceHistory(duration: HOUR) {
          timestamp
          close: value
        }
        priceHistory1D: priceHistory(duration: DAY) {
          timestamp
          close: value
        }
        priceHistory1W: priceHistory(duration: WEEK) {
          timestamp
          close: value
        }
        priceHistory1M: priceHistory(duration: MONTH) {
          timestamp
          close: value
        }
        priceHistory1Y: priceHistory(duration: YEAR) {
          timestamp
          close: value
        }
      }
      tokens {
        chain
        address
        symbol
        decimals
      }
    }
  }
`

/**
 * @returns undefined if loading, null if error, `GraphMetadatas` otherwise
 */
export function useTokenPriceGraphs(token: Token): NullUndefined<GraphMetadatas> {
  const { address, chain } = graphQLCurrencyInfo(token)
  const graphQLChain = toGraphQLChain(chain)

  const priceData = useLazyLoadQuery<TokenModel_PriceQuery>(
    priceQuery,
    {
      contract: {
        address,
        chain: graphQLChain ?? 'ETHEREUM',
      },
    },
    { networkCacheConfig: { poll: PollingInterval.Normal } }
  )

  return useMemo(() => {
    if (!priceData) {
      return undefined
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
      return null
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
}
