import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'

import { useQueryClient } from 'appGraphql/data/apollo/client'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const EXPLORE_STATS = () => {
  const queryString = `
    query GetTopPools { 
      v2Pairs(orderBy: "trackedReserveETH", orderDirection: "desc", limit: 100) {
        items {
          id
          protocolVersion
          chain
          address
          token0Supply
          token1Supply
          totalLiquidity
          txCount
          token0Price
          token1Price
          totalValueLockedUSD
          trackedReserveETH
          token0 {
            address
            name
            symbol
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          token1 {
            address
            name
            symbol
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          dayData(orderBy: "date", orderDirection: "desc", limit:30) {
            items {
              id
              dayId
              date
              volumeUSD
              untrackedVolumeUSD
            }
          }
          hourData(orderBy: "date", orderDirection: "desc", limit: 24) {
            items {
              id
              dayId
              date
              volumeUSD
              untrackedVolumeUSD
            }
          }
        }
      }
      v3Pools(orderBy: "totalValueLockedUSD", orderDirection: "desc", limit: 100) {
        items {
          id
          protocolVersion
          chain
          address
          token0Id
          token1Id
          token0Price
          token1Price
          feeTier
          totalValueLockedUSD
          token0 {
            address
            name
            symbol
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          token1 {
            address
            name
            symbol
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          dayData(orderBy: "date", orderDirection: "desc", limit:30) {
            items {
              id
              date
              dayId
              volumeUSD
              untrackedVolumeUSD
            }
          }
          hourData(orderBy: "date", orderDirection: "desc", limit: 24) {
            items {
              id
              date
              dayId
              volumeUSD
              untrackedVolumeUSD
            }
          }
        }
      }
      v4Pools(orderBy: "totalValueLockedUSD", orderDirection: "desc", limit: 100) {
        items {
          id
          protocolVersion
          chain
          poolId
          token0Id
          token1Id
          token0Price
          token1Price
          feeTier
          totalValueLockedUSD
          token0 {
            address
            name
            symbol
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          token1 {
            address
            name
            symbol
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          dayData(orderBy: "date", orderDirection: "desc", limit:30) {
            items {
              id
              date
              dayId
              volumeUSD
              untrackedVolumeUSD
            }
          }
          hourData(orderBy: "date", orderDirection: "desc", limit: 24) {
            items {
              id
              date
              dayId
              volumeUSD
              untrackedVolumeUSD
            }
          }
        }
      }
    }
  `
  return gql(queryString)
}

export function useRingExploreStatsQuery(chain: Chain) {
  const client = useQueryClient(chain)

  return useQuery(EXPLORE_STATS(), {
    variables: {},
    fetchPolicy: 'cache-and-network',
    client,
  })
}
