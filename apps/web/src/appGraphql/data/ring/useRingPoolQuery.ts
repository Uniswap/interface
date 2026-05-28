import { useQuery } from '@apollo/client'
import { useQueryClient } from 'appGraphql/data/apollo/client'
import gql from 'graphql-tag'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const GET_POOL = () => {
  const queryString = `
    query GetPool($v2PairId: String!, $v3PoolId: String!, $v4PoolId: String!) {
      v2Pair(id: $v2PairId) {
        id
        protocolVersion
        chain
        address
        createdAtTimestamp
        totalLiquidity
        token0Id
        reserve0
        token0Supply
        token1Id
        reserve1
        token1Supply
        txCount
        cumulativeVolume
        token0Price
        token1Price
        totalValueLockedUSD
        token0 {
          id
          address
          symbol
          name
          decimals
          chain
          standard
          derivedETH
          feesUSD
          totalValueLocked
          totalValueLockedUSD
          originToken {
            address
            name
            symbol
            decimals
          }
        }
        token1 {
          id
          address
          symbol
          name
          decimals
          chain
          standard
          derivedETH
          feesUSD
          totalValueLocked
          totalValueLockedUSD
          originToken {
            address
            name
            symbol
            decimals
          }
        }
        hourData(limit: 168, orderBy: "date", orderDirection: "desc") {
          items {
            date
            volumeUSD
            untrackedVolumeUSD
            token0Price
            token1Price
          }
        }
        dayData(limit: 365, orderBy: "date", orderDirection: "desc") {
          items {
            date
            volumeUSD
            untrackedVolumeUSD
            token0Price
            token1Price
          }
        }
      }
      v3Pool(id: $v3PoolId) {
        id
        protocolVersion
        chain
        address
        createdAtTimestamp
        liquidity
        token0Id
        totalValueLockedToken0
        token1Id
        totalValueLockedToken1
        txCount
        volumeUSD
        token0Price
        token1Price
        feeTier
        totalValueLockedUSD
        token0 {
          id
          address
          symbol
          name
          decimals
          chain
          standard
          derivedETH
          feesUSD
          totalValueLocked
          totalValueLockedUSD
          originToken {
            address
            name
            symbol
            decimals
          }
        }
        token1 {
          id
          address
          symbol
          name
          decimals
          chain
          standard
          derivedETH
          feesUSD
          totalValueLocked
          totalValueLockedUSD
          originToken {
            address
            name
            symbol
            decimals
          }
        }
        hourData(limit: 168, orderBy: "date", orderDirection: "desc") {
          items {
            date
            volumeUSD
            untrackedVolumeUSD
            token0Price
            token1Price
          }
        }
        dayData(limit: 365, orderBy: "date", orderDirection: "desc") {
          items {
            date
            volumeUSD
            untrackedVolumeUSD
            token0Price
            token1Price
          }
        }
      }
      v4Pool(id: $v4PoolId) {
        id
        protocolVersion
        chain
        poolId
        createdAtTimestamp
        liquidity
        token0Id
        totalValueLockedToken0
        token1Id
        totalValueLockedToken1
        txCount
        volumeUSD
        token0Price
        token1Price
        feeTier
        hooks
        totalValueLockedUSD
        token0 {
          id
          address
          symbol
          name
          decimals
          chain
          standard
          derivedETH
          feesUSD
          totalValueLocked
          totalValueLockedUSD
          originToken {
            address
            name
            symbol
            decimals
          }
        }
        token1 {
          id
          address
          symbol
          name
          decimals
          chain
          standard
          derivedETH
          feesUSD
          totalValueLocked
          totalValueLockedUSD
          originToken {
            address
            name
            symbol
            decimals
          }
        }
        hourData(limit: 168, orderBy: "date", orderDirection: "desc") {
          items {
            date
            volumeUSD
            untrackedVolumeUSD
            token0Price
            token1Price
          }
        }
        dayData(limit: 365, orderBy: "date", orderDirection: "desc") {
          items {
            date
            volumeUSD
            untrackedVolumeUSD
            token0Price
            token1Price
          }
        }
      }
    }
  `
  return gql(queryString)
}

export function useRingPoolQuery(variables: { poolId: string; chain: Chain; skip?: boolean }) {
  const client = useQueryClient(variables.chain)

  const variable = {
    v2PairId: `V2Pair:${variables.chain}_${variables.poolId.toLowerCase()}`,
    v3PoolId: `V3Pool:${variables.chain}_${variables.poolId.toLowerCase()}`,
    v4PoolId: `V4Pool:${variables.chain}_${variables.poolId.toLowerCase()}`,
  }

  return useQuery(GET_POOL(), {
    variables: variable,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    skip: variables.skip,
    client,
  })
}
