import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'

import { useQueryClient } from 'appGraphql/data/apollo/client'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const PROTOCOL_STATS = gql`
  query PROTOCOL_STATS {
    factorys {
      items {
        id
        ethPrice
        pairCount
        totalVolumeETH
        totalVolumeUSD
        untrackedVolumeUSD
        totalLiquidityETH
        totalLiquidityUSD
        txCount
        poolCount
        totalFeesUSD
        totalFeesETH
        totalValueLockedETH
        totalValueLockedUSD
        totalValueLockedUSDUntracked
        totalValueLockedETHUntracked
        owner
        dayData(orderBy: "dayId", orderDirection: "desc", limit: 3) {
          items {
            id
            dayId
            tvlUSD
            volumeUSD
            volumeUSDUntracked
            feesUSD
          }
        }
        hourData(orderBy: "hourId", orderDirection: "desc", limit: 24) {
          items {
            id
            hourId
            tvlUSD
            volumeUSD
            volumeUSDUntracked
            feesUSD
          }
        }
      }
    }
    factory(id: "factory-v2") {
      ethPrice
    }
    tokens(orderBy: "totalValueLockedUSD", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        chain
        name
        symbol
        decimals
        address
        standard
        totalValueLocked
        totalValueLockedUSD
        tradeVolumeUSD
        derivedETH
        untrackedVolumeUSD
        originToken {
          address
          name
          symbol
          decimals
          standard
        }
        dayData(orderBy: "date", orderDirection: "desc", limit: 30) {
          items {
            id
            date
            dayId
            protocolVersion
            volumeUSD
            priceUSD
            open
            high
            low
            close
          }
        }
        hourData(orderBy: "date", orderDirection: "desc", limit: 48) {
          items {
            id
            date
            dayId
            protocolVersion
            volumeUSD
            priceUSD
            open
            high
            low
            close
          }
        }
      }
    }
  }
`

export function useRingProtocolStatsQuery(chain: Chain) {
  const client = useQueryClient(chain)

  return useQuery(PROTOCOL_STATS, {
    variables: {},
    fetchPolicy: 'cache-and-network',
    client,
  })
}
