import { gql } from '@apollo/client'

import { BUNDLE_ID } from 'constants/index'
import { Block } from 'data/type'

export const ETH_PRICE = (block?: number) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id: ${BUNDLE_ID} }, block: {number: ${block}}, subgraphError: allow) {
        id
        ethPrice
      }
    }
  `
    : ` query bundles {
      bundles(where: { id: ${BUNDLE_ID} }, subgraphError: allow) {
        id
        ethPrice
      }
    }
  `
  return gql(queryString)
}

export const PROMM_ETH_PRICE = (block?: number) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id: ${BUNDLE_ID} }, block: {number: ${block}}, subgraphError: allow) {
        id
        ethPriceUSD
      }
    }
  `
    : ` query bundles {
      bundles(where: { id: ${BUNDLE_ID} }, subgraphError: allow) {
        id
        ethPriceUSD
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_DERIVED_ETH = (tokenAddress: string) => {
  const queryString = `
    query tokens {
      tokens(where: { id: "${tokenAddress.toLowerCase()}"}, subgraphError: allow) {
        derivedETH
      }
    }
    `

  return gql(queryString)
}

export const GLOBAL_DATA_ELASTIC = () => {
  const queryString = `query factories {
    factories(subgraphError: allow) {
        id
        poolCount
        txCount
        totalVolumeUSD
        totalVolumeETH
        totalFeesUSD
        untrackedVolumeUSD
        totalValueLockedUSD
        totalValueLockedETH
      }
    }`

  return gql(queryString)
}

export const GLOBAL_DATA = (block?: number) => {
  const queryString = `query dmmFactories {
    dmmFactories${block ? `(block: { number: ${block}}, subgraphError: allow)` : `(subgraphError: allow)`} {
        id
        totalVolumeUSD
        totalFeeUSD
        totalVolumeETH
        untrackedVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
        totalAmplifiedLiquidityUSD
        totalAmplifiedLiquidityETH
        txCount
        pairCount
      }
    }`

  return gql(queryString)
}

export const GET_BLOCK = gql`
  query blocks($timestampFrom: Int!, $timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
      subgraphError: allow
    ) {
      id
      number
      timestamp
    }
  }
`

export const GET_BLOCKS = (timestamps: number[]): import('graphql').DocumentNode => {
  let queryString = 'query blocksByTimestamps {'
  queryString += timestamps.map(timestamp => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
      number
    }`
  })
  queryString += '}'
  return gql(queryString)
}

const PoolFields = (withFee?: boolean) => `
    id
    txCount
    token0 {
      id
      symbol
      name
      decimals
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      decimals
      totalLiquidity
      derivedETH
    }
    amp
    reserve0
    reserve1
    vReserve0
    vReserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    ${withFee ? 'fee' : ''}
    feeUSD
    untrackedVolumeUSD
    untrackedFeeUSD
    token0Price
    token1Price
    token0PriceMin
    token0PriceMax
    token1PriceMin
    token1PriceMax
    createdAtTimestamp
`

export const USER_POSITIONS = gql`
  query liquidityPositions($user: Bytes!) {
    liquidityPositions(where: { user: $user }, subgraphError: allow) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
          symbol
          derivedETH
        }
        totalSupply
      }
      pool {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
          symbol
          derivedETH
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`

export const POOL_DATA = (poolAddress: string, block: number, withFee?: boolean) => {
  const queryString = `
    query pools {
      pools(${block ? `block: {number: ${block}}` : ``} where: { id: "${poolAddress}"}, subgraphError: allow) {
        ${PoolFields(withFee)}
      }
    }
    `

  return gql(queryString)
}

export const HOURLY_POOL_RATES = (blocks: Block[], poolAddress: string): import('graphql').DocumentNode => {
  let queryString = 'query poolPriceByBlocks {'
  queryString += blocks.map(
    block => `
      t${block.timestamp}: pool(id:"${poolAddress.toLowerCase()}", block: { number: ${
      block.number
    } }, subgraphError: allow) {
        token0Price
        token1Price
      }
    `,
  )

  queryString += '}'
  return gql(queryString)
}

export const POOL_COUNT = gql`
  {
    dmmFactories(subgraphError: allow) {
      poolCount
    }
  }
`

export const POOLS_BULK_FROM_LIST = (pools: string[], withFee?: boolean) => {
  let poolsString = `[`
  pools.map((pool: string) => {
    return (poolsString += `"${pool}"`)
  })
  poolsString += ']'

  const queryString = `
  query pools {
    pools(first: ${
      pools.length
    }, where: {id_in: ${poolsString}}, orderBy: reserveUSD, orderDirection: desc, subgraphError: allow) {
        ${PoolFields(withFee)}
    }
  }
  `

  return gql`
    ${queryString}
  `
}

export const POOLS_BULK_WITH_PAGINATION = (first: number, skip: number, withFee?: boolean) => {
  const queryString = `
  query pools {
    pools(first: ${first}, skip: ${skip}, subgraphError: allow) {
      ${PoolFields(withFee)}
    }
  }
  `

  return gql`
    ${queryString}
  `
}

export const POOLS_HISTORICAL_BULK_FROM_LIST = (block: number, pools: string[], withFee?: boolean) => {
  let poolsString = `[`
  pools.map((pool: string) => {
    return (poolsString += `"${pool}"`)
  })
  poolsString += ']'

  const queryString = `
  query pools {
    pools(first: ${
      pools.length
    }, where: {id_in: ${poolsString}}, block: {number: ${block}}, orderBy: reserveUSD, orderDirection: desc, subgraphError: allow) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      ${withFee ? 'fee' : ''}
      feeUSD
      untrackedVolumeUSD
      untrackedFeeUSD
    }
  }
  `

  return gql(queryString)
}

export const POOLS_HISTORICAL_BULK_WITH_PAGINATION = (
  first: number,
  skip: number,
  block: number,
  withFee?: boolean,
) => {
  const queryString = `
  query pools {
    pools(first: ${first}, skip: ${skip}, block: {number: ${block}}, subgraphError: allow) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      ${withFee ? 'fee' : ''}
      feeUSD
      untrackedVolumeUSD
      untrackedFeeUSD
    }
  }
  `

  return gql(queryString)
}

export const FARM_HISTORIES = gql`
  query farmHistories($user: String!) {
    deposits(where: { user: $user }) {
      id
      timestamp
      poolID
      stakeToken
      amount
    }
    withdraws(where: { user: $user }) {
      id
      timestamp
      poolID
      stakeToken
      amount
    }
    harvests(where: { user: $user }) {
      id
      timestamp
      poolID
      rewardToken
      stakeToken
      amount
    }
    vests(where: { user: $user }) {
      id
      timestamp
      rewardToken
      amount
    }
  }
`

export const GET_POOL_VALUES_AFTER_MINTS_SUCCESS = gql`
  query getPoolValuesAfterMintsSuccess($poolAddress: String!) {
    pool(id: $poolAddress) {
      id
      reserve0
      reserve1
      reserveUSD
      mints(orderBy: timestamp, orderDirection: desc, first: 20) {
        id
        amount0
        amount1
        amountUSD
      }
    }
  }
`

export const GET_POOL_VALUES_AFTER_BURNS_SUCCESS = gql`
  query getPoolValuesAfterBurnsSuccess($poolAddress: String!) {
    pool(id: $poolAddress) {
      id
      reserve0
      reserve1
      reserveUSD
      burns(orderBy: timestamp, orderDirection: desc, first: 20) {
        id
        amount0
        amount1
        amountUSD
      }
    }
  }
`
export const GET_MINT_VALUES_AFTER_CREATE_POOL_SUCCESS = gql`
  query getPoolValuesAfterBurnsSuccess($transactionHash: String!) {
    transaction(id: $transactionHash) {
      id
      mints {
        id
        amount0
        amount1
        amountUSD
      }
    }
  }
`
